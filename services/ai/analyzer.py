"""Pipeline analisis CekLoker.

Alur: gambar/teks → model (RawAnalysis) → pengayaan dari katalog + skor dari kode
→ AnalysisResult (kontrak publik di schema.py).

Model hanya mengisi code, quote, reason, kotak bukti, dan transkripsi. Label,
severity, dasar hukum, dan tingkat risiko SELALU dihitung di sini dari katalog.
"""
import hashlib
import json
import logging
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv

from catalog import get_catalog
from normalize import NORMALIZATION_VERSION, normalize
from prompts import KODE_DARI_DATA_RESMI, build_system_prompt
from providers import ModelError, panggil
from schema import (
    PROMPT_VERSION,
    AnalysisResult,
    BBox,
    Extracted,
    Fingerprint,
    Meta,
    RawAnalysis,
    RedFlag,
    Region,
)
from scoring import hitung_risiko

load_dotenv()
log = logging.getLogger("cekloker")

# Penyedia LLM: gemini (Google AI Studio langsung) atau openrouter.
PROVIDER = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
if PROVIDER == "openrouter":
    MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-3.6-flash")
    FALLBACK = os.getenv("OPENROUTER_FALLBACK_MODEL", "")
else:
    MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    FALLBACK = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash")

# Cache hasil MENTAH model di disk, hanya untuk eval (hemat kuota). main.py mematikannya
# secara bawaan supaya isi gambar pengguna tidak tersimpan di disk.
CACHE_DIR = Path(__file__).parent / ".cache"
PAKAI_CACHE = os.getenv("CEKLOKER_CACHE", "1") != "0"

MAKS_REGION_GAMBAR = 5  # kontrak: Region.image_index 0..4

# Model yang kuota HARIANNYA habis selama proses ini berjalan
_HABIS: set[str] = set()

_NEGARA_LN = (
    "luar negeri", "malaysia", "singapura", "singapore", "brunei", "thailand", "kamboja", "cambodia",
    "myanmar", "laos", "vietnam", "filipina", "philippines", "taiwan", "hong kong", "hongkong", "jepang",
    "japan", "korea", "tiongkok", "china", "arab saudi", "saudi", "uni emirat arab", "uae", "dubai",
    "abu dhabi", "qatar", "kuwait", "oman", "bahrain", "turki", "turkey", "polandia", "poland", "jerman",
    "germany", "belanda", "inggris", "australia", "selandia baru", "new zealand", "amerika", "kanada",
    "madagaskar", "afrika", "eropa", "timur tengah",
)
_FLAG_LN = {"visa_turis", "negara_rawan", "tiket_tanpa_kontrak"}


class AnalysisFailed(Exception):
    """Input tidak bisa dianalisis. main.py mengubahnya menjadi HTTP 422 + error_code."""

    def __init__(self, error_code: str, message: str):
        super().__init__(message)
        self.error_code = error_code
        self.message = message


# ---------------------------------------------------------------- panggilan model
def _kuota_harian_habis(e: Exception) -> bool:
    pesan = str(e)
    return getattr(e, "code", None) == 429 and (
        "PerDay" in pesan or "per day" in pesan.lower() or "per-day" in pesan.lower()
    )


def _daftar_model() -> list[str]:
    return list(dict.fromkeys(m for m in (MODEL, FALLBACK) if m))


def _panggil_model(bagian, system_prompt: str, percobaan: int = 6) -> tuple[RawAnalysis, str]:
    """Return (hasil_terparse, nama_model). Kuota harian habis → pindah model seketika.
    Error sementara (429/5xx) → jeda lalu ulang."""
    daftar = _daftar_model()
    terakhir: Exception | None = None
    json_rusak = 0
    for i in range(percobaan):
        tersedia = [m for m in daftar if m not in _HABIS]
        if not tersedia:
            raise RuntimeError(
                "Kuota harian habis untuk semua model: " + ", ".join(daftar)
            ) from terakhir
        model = tersedia[i % len(tersedia)]
        try:
            return panggil(PROVIDER, model, bagian, system_prompt, RawAnalysis), model
        except ModelError as e:
            terakhir = e
            if _kuota_harian_habis(e):
                _HABIS.add(model)
                continue
            kode = getattr(e, "code", None)
            # Model sesekali melantur sehingga jawabannya bukan JSON utuh. Sifatnya acak,
            # jadi ulangi (paling banyak 2 kali) tanpa menunggu.
            if kode is None and "bukan JSON" in str(e) and json_rusak < 2:
                json_rusak += 1
                log.warning("jawaban model rusak, mengulang (%d/2)", json_rusak)
                continue
            if kode not in (408, 429, 500, 502, 503, 504) or i == percobaan - 1:
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
    h.update(f"|{PROVIDER}|{MODEL}".encode())
    return h.hexdigest()


# ---------------------------------------------------------------- pemetaan ke kontrak
def _luar_negeri(extracted_country: str | None, kodes: set[str]) -> bool:
    """Perkiraan sederhana: penempatan luar negeri bila negara/lokasi menyebut tempat di
    luar Indonesia, atau ada red flag yang khas penempatan luar negeri."""
    if _FLAG_LN & kodes:
        return True
    lokasi = (extracted_country or "").lower()
    return any(n in lokasi for n in _NEGARA_LN)


def _bbox(box: list[int] | None) -> BBox | None:
    """box_2d [ymin, xmin, ymax, xmax] skala 0-1000 → BBox {x, y, w, h} skala 0-1.
    Kotak tidak valid atau berukuran nol dibuang (None)."""
    if not box or len(box) != 4:
        return None
    ymin, xmin, ymax, xmax = (min(1000, max(0, int(v))) for v in box)
    if ymax <= ymin or xmax <= xmin:
        return None
    return BBox(x=xmin / 1000, y=ymin / 1000, w=(xmax - xmin) / 1000, h=(ymax - ymin) / 1000)


# Model kadang menempelkan koordinat ke dalam teks, mis. "KLIK LINK DI BIO photo_index 0 box_2d [848,154,883,476]".
_BOX_BOCOR = re.compile(
    r"\s*(?:(?:photo_index|image_index)\s*[:=]?\s*(\d+)\s*)?"
    r"(?:box_2d|box2d|bound(?:ing|ary)[\s_]*box)\s*[:=]?\s*\[\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\]",
    re.I,
)


def _pisah_box(teks: str | None) -> tuple[str | None, int | None, list[int] | None]:
    """Buang koordinat yang bocor dari sebuah teks. Return (teks_bersih, image_index, box_2d)."""
    if not teks:
        return teks, None, None
    m = _BOX_BOCOR.search(teks)
    if not m:
        return teks, None, None
    idx = int(m.group(1)) if m.group(1) is not None else None
    box = [int(m.group(i)) for i in (2, 3, 4, 5)]
    return _BOX_BOCOR.sub("", teks).strip(), idx, box


def _quote_valid(quote: str | None, sumber_ternormalisasi: str) -> bool:
    if not quote or not quote.strip():
        return False
    q = normalize(quote)
    if q and q in sumber_ternormalisasi:
        return True
    log.warning("quote bukan potongan input, dikosongkan: %.80r", quote)
    return False


def _gabung_kode_sama(flags: list[RedFlag]) -> list[RedFlag]:
    """Satu kode tampil sekali. Bila model mengulang kode yang sama, gabungkan:
    pakai kutipan pertama yang valid dan kumpulkan semua region."""
    hasil: dict[str, RedFlag] = {}
    for f in flags:
        ada = hasil.get(f.code)
        if ada is None:
            hasil[f.code] = f
            continue
        regions = ada.regions + [r for r in f.regions if r not in ada.regions]
        update = {"regions": regions}
        if ada.quote is None and f.quote is not None:
            update.update(quote=f.quote, reason=f.reason)
        hasil[f.code] = ada.model_copy(update=update)
    return list(hasil.values())


def bangun_hasil(
    raw: RawAnalysis,
    *,
    model: str,
    jumlah_gambar: int,
    teks: str | None,
    latency_ms: int,
) -> AnalysisResult:
    """Ubah output mentah model menjadi AnalysisResult. Fungsi murni (tanpa jaringan)."""
    if raw.rejection:
        raise AnalysisFailed(raw.rejection, f"Model menolak input: {raw.rejection}")

    katalog = get_catalog()
    entri = katalog.by_code()

    # Buang kode yang tidak dikenal atau yang bukan jatah model
    mentah_ok = []
    for f in raw.red_flags:
        if f.code in KODE_DARI_DATA_RESMI or f.code not in entri:
            log.warning("kode red flag dari model diabaikan: %r", f.code)
            continue
        mentah_ok.append(f)

    raw_teks, _, _ = _pisah_box(raw.extracted_text)
    summary, _, _ = _pisah_box(raw.summary)
    teks_ekstrak = (raw_teks or "").strip() or (teks or "").strip()
    if not teks_ekstrak and not mentah_ok:
        raise AnalysisFailed("no_text_found", "Tidak ada teks yang terbaca dari input.")

    # Penjaga: quote harus benar-benar potongan dari input. Kalau bukan (model mengarang atau
    # menempelkan seluruh input), kosongkan quote, tetapi tetap simpan red flag-nya.
    sumber = normalize(f"{raw_teks} {teks or ''}")
    kodes = {f.code for f in mentah_ok}
    luar = _luar_negeri(raw.extracted.country, kodes)

    red_flags: list[RedFlag] = []
    for f in mentah_ok:
        e = entri[f.code]
        legal = e.legal_basis
        # Pasal UU Pekerja Migran hanya relevan untuk penempatan ke luar negeri
        if legal and legal.startswith("UU No. 18") and not luar:
            legal = None
        quote, idx_q, box_q = _pisah_box(f.quote)
        reason, _, _ = _pisah_box(f.reason)
        # Kotak bocor di kutipan dipakai hanya bila field box_2d yang benar kosong
        box = f.box_2d if f.box_2d else box_q
        idx = f.image_index if (f.box_2d or idx_q is None) else idx_q
        regions: list[Region] = []
        if 0 <= idx < min(jumlah_gambar, MAKS_REGION_GAMBAR):
            bb = _bbox(box)
            if bb is not None:
                regions.append(Region(image_index=idx, bbox=bb))
        red_flags.append(
            RedFlag(
                code=e.code,
                label=e.label,
                severity=e.severity,
                quote=quote if _quote_valid(quote, sumber) else None,
                reason=reason or f.reason,
                legal_basis=legal,
                regions=regions,
            )
        )

    red_flags = _gabung_kode_sama(red_flags)

    confidence = min(1.0, max(0.0, raw.confidence))
    risiko = hitung_risiko([f.code for f in red_flags], confidence)

    return AnalysisResult(
        input_type=raw.input_type,
        risk_level=risiko["risk_level"],
        confidence=confidence,
        needs_manual_check=risiko["needs_manual_check"],
        summary=summary or raw.summary,
        extracted=Extracted(**raw.extracted.model_dump()),
        red_flags=red_flags,
        fingerprint=Fingerprint(
            image_phash=[],  # pHash gambar asli dihitung di sisi web (gambar di sini sudah di-blur)
            raw_text=teks_ekstrak,
            normalized_text=normalize(teks_ekstrak),
        ),
        meta=Meta(
            model=model,
            prompt_version=PROMPT_VERSION,
            catalog_version=katalog.version,
            normalization_version=NORMALIZATION_VERSION,
            risk_score=risiko["risk_score"],
            latency_ms=latency_ms,
        ),
    )


# ---------------------------------------------------------------- pintu masuk
def analisis(gambar: list[tuple[bytes, str]], teks: str | None = None) -> AnalysisResult:
    """gambar: list (bytes, mime_type). teks: teks lowongan/chat opsional.
    Raise AnalysisFailed bila input tidak bisa dianalisis."""
    t0 = time.time()
    bagian = [("img", b, m) for b, m in gambar]
    if teks:
        bagian.append(("txt", f"Teks lowongan/chat:\n{teks}"))
    bagian.append(("txt", "Periksa input di atas sesuai instruksi."))

    system_prompt = build_system_prompt()
    file_cache = CACHE_DIR / f"{_kunci_cache(gambar, teks, system_prompt)}.json"

    if PAKAI_CACHE and file_cache.exists():
        isi = json.loads(file_cache.read_text(encoding="utf-8"))
        raw, model = RawAnalysis.model_validate(isi["raw"]), isi["model"]
    else:
        raw, model = _panggil_model(bagian, system_prompt)
        if PAKAI_CACHE:
            CACHE_DIR.mkdir(exist_ok=True)
            file_cache.write_text(
                json.dumps({"model": model, "raw": raw.model_dump(mode="json")}, ensure_ascii=False),
                encoding="utf-8",
            )

    return bangun_hasil(
        raw,
        model=model,
        jumlah_gambar=len(gambar),
        teks=teks,
        latency_ms=int((time.time() - t0) * 1000),
    )
