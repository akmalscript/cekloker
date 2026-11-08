"""Endpoint AI CekLoker untuk tim full stack.

Jalankan : uvicorn main:app --port 8000
Uji      : buka http://localhost:8000/docs

Pengaturan lewat .env (semuanya opsional, ada nilai bawaan yang aman):
  ALLOWED_ORIGINS         domain web yang boleh memanggil dari browser, pisahkan koma
  CEKLOKER_API_KEY        kunci rahasia antara backend web dan API ini. Bila diisi,
                          setiap permintaan wajib membawa header  X-API-Key: <kunci>
  CEKLOKER_RATE_PER_MIN   batas permintaan per alamat IP per menit (bawaan 10)
  CEKLOKER_DAILY_CAP      batas total analisis per hari untuk semua pengguna (bawaan 200)
  CEKLOKER_TRUST_PROXY    1 bila API berada di belakang proxy/hosting yang mengisi X-Forwarded-For
  CEKLOKER_MAX_GAMBAR     jumlah gambar maksimal per permintaan (bawaan 3)
  CEKLOKER_MAX_MB         ukuran maksimal per gambar dalam MB (bawaan 10, sama dengan web)
  CEKLOKER_MAX_TEKS       panjang teks maksimal dalam karakter (bawaan 10000, sama dengan web)
  CEKLOKER_MAX_SISI       sisi terpanjang gambar dalam piksel sebelum dikirim ke AI (bawaan 1600, 0 = mati)
"""
import hmac
import io
import logging
import os
import threading
import time
import uuid
from collections import defaultdict, deque
from datetime import date

from dotenv import load_dotenv

load_dotenv()
# Cache hanya untuk eval. Untuk pengguna sungguhan, bawaannya MATI supaya isi gambar
# pengguna tidak tersimpan di disk. Set CEKLOKER_CACHE=1 di .env hanya bila perlu.
os.environ.setdefault("CEKLOKER_CACHE", "0")

from fastapi import FastAPI, File, Form, Header, HTTPException, Request, UploadFile  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from PIL import Image  # noqa: E402

from analyzer import AnalysisFailed, analisis  # noqa: E402
from schema import AnalysisError, AnalysisResult  # noqa: E402

log = logging.getLogger("cekloker")
logging.basicConfig(level=logging.INFO)

# Domain resmi produksi dan pengembangan (AGENTS.md §4)
# TODO: kunci saat deploy ke domain resmi produksi
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "https://cekloker.id,https://www.cekloker.id,http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

API_KEY = os.getenv("CEKLOKER_API_KEY", "")
RATE_PER_MIN = int(os.getenv("CEKLOKER_RATE_PER_MIN", "10"))
DAILY_CAP = int(os.getenv("CEKLOKER_DAILY_CAP", "200"))
TRUST_PROXY = os.getenv("CEKLOKER_TRUST_PROXY", "0") == "1"
MAX_SISI = int(os.getenv("CEKLOKER_MAX_SISI", "1600"))
MAKS_GAMBAR = int(os.getenv("CEKLOKER_MAX_GAMBAR", "3"))
MAKS_BYTE = int(os.getenv("CEKLOKER_MAX_MB", "10")) * 1024 * 1024
MAKS_TEKS = int(os.getenv("CEKLOKER_MAX_TEKS", "10000"))

FORMAT_OK = {"image/jpeg", "image/png", "image/webp"}

app = FastAPI(title="CekLoker AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------- pembatas permintaan
_kunci = threading.Lock()
_riwayat: dict[str, deque] = defaultdict(deque)
_harian = {"tanggal": date.today(), "jumlah": 0}


def _ip(request: Request) -> str:
    if TRUST_PROXY:
        xff = request.headers.get("x-forwarded-for", "")
        if xff:
            return xff.split(",")[0].strip()
    return request.client.host if request.client else "tanpa-ip"


def _cek_batas(ip: str) -> None:
    now = time.time()
    with _kunci:
        if _harian["tanggal"] != date.today():
            _harian.update(tanggal=date.today(), jumlah=0)
        if _harian["jumlah"] >= DAILY_CAP:
            raise HTTPException(503, "Kuota analisis hari ini sudah habis. Coba lagi besok.")
        q = _riwayat[ip]
        while q and now - q[0] > 60:
            q.popleft()
        if len(q) >= RATE_PER_MIN:
            raise HTTPException(429, "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.")
        q.append(now)
        _harian["jumlah"] += 1


def _cek_kunci(x_api_key: str | None) -> None:
    if API_KEY and not hmac.compare_digest(x_api_key or "", API_KEY):
        raise HTTPException(401, "Akses ditolak.")


# ---------------------------------------------------------------- gambar
def _perkecil(data: bytes, mime: str) -> tuple[bytes, str]:
    """Perkecil gambar besar supaya lebih cepat dan murah. Kotak bukti (box_2d) tetap
    berlaku karena skalanya relatif 0-1000 terhadap ukuran gambar."""
    if MAX_SISI <= 0:
        return data, mime
    try:
        img = Image.open(io.BytesIO(data))
        if max(img.size) <= MAX_SISI:
            return data, mime
        img.thumbnail((MAX_SISI, MAX_SISI))
        if img.mode not in ("RGB", "L"):
            img = img.convert("RGB")
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=85)
        return out.getvalue(), "image/jpeg"
    except Exception:
        raise HTTPException(400, "Gambar tidak dapat dibaca. Coba unggah ulang.")


# ---------------------------------------------------------------- endpoint
@app.get("/health")
@app.head("/health")
def health():
    return {"ok": True}


@app.post("/analyze", response_model=AnalysisResult)
def analyze(  # sengaja bukan async: analisis memakai panggilan blocking, FastAPI menjalankannya di thread
    request: Request,
    files: list[UploadFile] = File(default=[]),
    teks: str | None = Form(default=None),
    x_api_key: str | None = Header(default=None),
):
    _cek_kunci(x_api_key)
    if not files and not teks:
        raise HTTPException(400, "Kirim minimal satu gambar atau teks.")
    if len(files) > MAKS_GAMBAR:
        raise HTTPException(400, f"Maksimal {MAKS_GAMBAR} gambar.")
    if teks and len(teks) > MAKS_TEKS:
        raise HTTPException(400, f"Teks maksimal {MAKS_TEKS} karakter.")

    gambar = []
    for f in files:
        if f.content_type not in FORMAT_OK:
            raise HTTPException(400, "Format tidak didukung. Gunakan JPG, PNG, atau WEBP.")
        data = f.file.read(MAKS_BYTE + 1)
        if len(data) > MAKS_BYTE:
            raise HTTPException(400, f"Ukuran gambar maksimal {MAKS_BYTE // (1024 * 1024)} MB.")
        gambar.append(_perkecil(data, f.content_type))

    _cek_batas(_ip(request))  # dihitung setelah validasi, supaya input salah tidak memakan jatah

    try:
        return analisis(gambar, teks)
    except AnalysisFailed as e:
        # Input tidak bisa dianalisis (bukan lowongan, tanpa teks, gambar buram) → 422 sesuai kontrak
        return JSONResponse(
            status_code=422,
            content=AnalysisError(error_code=e.error_code, message=e.message).model_dump(),
        )
    except Exception:
        kode = uuid.uuid4().hex[:8]
        log.exception("analisis gagal [%s]", kode)  # detail hanya di log server
        raise HTTPException(502, f"Layanan AI sedang bermasalah. Coba lagi nanti. (kode: {kode})")
