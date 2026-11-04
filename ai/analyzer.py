import hashlib
import json
import os
import time
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

from prompts import build_system_prompt
from redflags import RED_FLAGS
from schema import AnalysisResult
from scoring import hitung_risiko

load_dotenv()

# Ganti lewat .env. Cek nama model terbaru di Google AI Studio.
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
FALLBACK = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash")
_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

# Cache hasil MENTAH model di disk. Tujuannya menghemat kuota: menjalankan ulang
# eval setelah mengubah bobot/skor (bukan prompt) tidak memanggil API lagi.
# Kunci cache = gambar + teks + prompt, jadi mengubah prompt otomatis memanggil ulang.
CACHE_DIR = Path(__file__).parent / ".cache"
PAKAI_CACHE = os.getenv("CEKLOKER_CACHE", "1") != "0"

DISCLAIMER = (
    "Hasil ini adalah indikasi risiko dari alat bantu AI, bukan keputusan hukum "
    "dan bukan jaminan lowongan pasti aman atau pasti penipuan."
)

# Model yang kuota HARIANNYA habis selama proses ini berjalan
_HABIS: set[str] = set()


def retrieve_context(teks_query: str) -> str:
    """TODO (langkah RAG): cari rujukan relevan (red flag, dasar hukum,
    laporan penipuan) lalu kembalikan sebagai teks. Sementara kosong."""
    return ""


def _kuota_harian_habis(e: Exception) -> bool:
    pesan = str(e)
    return getattr(e, "code", None) == 429 and ("PerDay" in pesan or "per day" in pesan)


def _panggil_model(contents, system_prompt: str, percobaan: int = 6):
    """Return (response, nama_model). Kuota harian habis -> pindah model
    SEKETIKA (tanpa menunggu). Error sementara (429/500/503) -> jeda lalu ulang."""
    daftar = list(dict.fromkeys(m for m in (MODEL, FALLBACK) if m))
    terakhir: Exception | None = None
    for i in range(percobaan):
        tersedia = [m for m in daftar if m not in _HABIS]
        if not tersedia:
            raise RuntimeError(
                "Kuota harian habis untuk semua model: " + ", ".join(daftar)
                + ". Coba lagi nanti, ganti model di .env, atau pakai tier berbayar."
            ) from terakhir
        model = tersedia[i % len(tersedia)]
        try:
            resp = _client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json",
                    response_schema=AnalysisResult,
                    temperature=0.1,
                ),
            )
            return resp, model
        except Exception as e:
            terakhir = e
            if _kuota_harian_habis(e):
                _HABIS.add(model)
                continue
            kode = getattr(e, "code", None)
            if kode not in (429, 500, 503) or i == percobaan - 1:
                raise
            time.sleep(min(5 * 2**i, 30))  # 5, 10, 20, 30 detik
    raise terakhir  # type: ignore[misc]


def _kunci_cache(gambar, teks, system_prompt) -> str:
    h = hashlib.sha256()
    for b, m in gambar:
        h.update(b)
        h.update(m.encode())
    h.update((teks or "").encode())
    h.update(system_prompt.encode())
    return h.hexdigest()


def analisis(gambar: list[tuple[bytes, str]], teks: str | None = None) -> dict:
    """gambar: list (bytes, mime_type). teks: teks lowongan/chat opsional."""
    contents = [types.Part.from_bytes(data=b, mime_type=m) for b, m in gambar]
    if teks:
        contents.append(f"Teks lowongan/chat:\n{teks}")
    contents.append("Periksa input di atas sesuai instruksi.")

    system_prompt = build_system_prompt(retrieve_context(teks or ""))

    file_cache = CACHE_DIR / f"{_kunci_cache(gambar, teks, system_prompt)}.json"
    dari_cache = False
    if PAKAI_CACHE and file_cache.exists():
        data = json.loads(file_cache.read_text(encoding="utf-8"))
        dari_cache = True
    else:
        t0 = time.time()
        resp, model = _panggil_model(contents, system_prompt)
        hasil: AnalysisResult = resp.parsed or AnalysisResult(**json.loads(resp.text))
        data = hasil.model_dump(mode="json")
        data["_model"] = model
        data["_detik"] = round(time.time() - t0, 1)
        if PAKAI_CACHE:
            CACHE_DIR.mkdir(exist_ok=True)
            file_cache.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

    # Pengayaan + skor dihitung ULANG dari data mentah (jadi tuning bobot gratis)
    for f in data["red_flags"]:
        meta = RED_FLAGS[f["kode"]]
        f["label"] = meta["label"]
        f["bobot"] = meta["weight"]
        f["dasar_hukum"] = meta["legal"]

    data.update(hitung_risiko([f["kode"] for f in data["red_flags"]], data["keyakinan"]))
    data["disclaimer"] = DISCLAIMER
    data["_dari_cache"] = dari_cache
    return data
