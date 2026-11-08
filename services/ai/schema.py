"""
Schema CekLoker — dua lapis model:

  RawAnalysis  : output mentah Gemini (internal, tidak keluar ke API publik).
                 Tidak ada validasi ketat supaya kompatibel dengan subset
                 JSON Schema yang didukung Gemini.

  AnalysisResult : kontrak publik AI service → backend → frontend.
                   Semua field di-derive dari katalog dan scoring.py;
                   model hanya mengisi code, quote, reason, dan box_2d.

KONTRAK DIKUNCI — jangan ubah nama field tanpa:
  1. Koordinasi dengan pemilik apps/web/ (Akmal, Dhimas).
  2. Bump schema_version.
  3. Regenerate OpenAPI + TypeScript (lihat AGENTS.md §5).
"""
import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ─── Tipe literal ──────────────────────────────────────────────────────────────
RiskLevel = Literal["aman", "waspada", "bahaya"]
FlagSeverity = Literal["waspada", "bahaya"]   # tidak ada "aman" per flag
InputType = Literal["lowongan", "chat", "gabungan"]

PROMPT_VERSION = "v1.0"
_PHASH_RE = re.compile(r"^[0-9a-f]{16}$")


# ─── Base model ketat (dipakai untuk kontrak publik) ───────────────────────────
class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")


# ═══════════════════════════════════════════════════════════════════════════════
# Output MENTAH dari Gemini (internal — tidak dikirim ke API publik)
# ═══════════════════════════════════════════════════════════════════════════════

class RawFlag(BaseModel):
    """Satu red flag sebagaimana dikembalikan Gemini. Hanya code, kutipan, alasan, kotak."""
    code: str
    quote: str | None = None
    reason: str
    box_2d: list[int] | None = None   # [ymin, xmin, ymax, xmax], skala 0-1000
    image_index: int = 0


RejectionCode = Literal["no_text_found", "not_a_job_posting", "low_quality_image"]


class RawExtracted(BaseModel):
    """Info lowongan versi mentah (longgar). Divalidasi ulang menjadi Extracted."""
    position: str | None = None
    company: str | None = None
    country: str | None = None
    salary: str | None = None
    requirements: list[str] = Field(default_factory=list)
    contact: list[str] = Field(default_factory=list)
    fees: str | None = None


class RawAnalysis(BaseModel):
    """Keseluruhan output mentah Gemini sebelum pengayaan dari katalog dan scoring.py."""
    summary: str
    confidence: float
    input_type: InputType = "lowongan"
    rejection: RejectionCode | None = None   # terisi bila input tidak bisa dianalisis (HTTP 422)
    extracted_text: str               # transkripsi penuh → menjadi fingerprint.raw_text
    extracted: RawExtracted           # divalidasi ulang menjadi Extracted
    red_flags: list[RawFlag]


# ═══════════════════════════════════════════════════════════════════════════════
# Kontrak publik AnalysisResult
# ═══════════════════════════════════════════════════════════════════════════════

class BBox(Strict):
    """Bounding box dinormalisasi 0–1, format {x, y, w, h}."""
    x: float = Field(ge=0, le=1)
    y: float = Field(ge=0, le=1)
    w: float = Field(gt=0, le=1)      # lebar > 0 (kotak nol-piksel dibuang di analyzer)
    h: float = Field(gt=0, le=1)

    @model_validator(mode="after")
    def inside_image(self) -> "BBox":
        eps = 1e-6
        if self.x + self.w > 1 + eps or self.y + self.h > 1 + eps:
            raise ValueError(
                f"bbox keluar dari batas gambar: x={self.x}+w={self.w}, y={self.y}+h={self.h}"
            )
        return self


class Region(Strict):
    image_index: int = Field(ge=0, le=4)   # FR-LOK-01: maks 5 gambar (indeks 0–4)
    bbox: BBox


class Extracted(Strict):
    """Informasi yang diekstrak dari lowongan. Selalu ada, field opsional boleh null."""
    position: str | None = None
    company: str | None = None
    country: str | None = None
    salary: str | None = None
    requirements: list[str] = Field(default_factory=list)   # [] bukan null (FR-LOK-06)
    contact: list[str] = Field(default_factory=list)
    fees: str | None = None


class RedFlag(Strict):
    """Satu red flag yang sudah diperkaya dari katalog. Label, severity, legal_basis
    TIDAK diisi oleh model — selalu diambil dari catalog.py berdasarkan code."""
    code: str
    label: str
    severity: FlagSeverity
    quote: str | None = None
    reason: str
    legal_basis: str | None = None
    regions: list[Region] = Field(default_factory=list)   # kosong untuk input teks/chat


class Fingerprint(Strict):
    """Data untuk scam matching. pHash dari gambar ASLI (sebelum PII blur);
    raw_text dan normalized_text dari gambar post-blur."""
    image_phash: list[str] = Field(
        default_factory=list,
        description="pHash hex 16 karakter per gambar, urut image_index, dari gambar ASLI",
    )
    raw_text: str             # transkripsi mentah dari Gemini (post-blur)
    normalized_text: str      # hasil normalize(raw_text)

    @field_validator("image_phash")
    @classmethod
    def phash_hex_format(cls, v: list[str]) -> list[str]:
        for h in v:
            if not _PHASH_RE.fullmatch(h):
                raise ValueError(
                    f"image_phash harus 16 karakter hex lowercase, dapat: {h!r}"
                )
        return v


class Meta(Strict):
    """Metadata teknis untuk debugging dan tuning. Tidak ditampilkan ke pengguna."""
    model: str
    prompt_version: str
    catalog_version: str
    normalization_version: str
    risk_score: int = Field(ge=0)
    latency_ms: int = Field(ge=0)


class AnalysisResult(Strict):
    """Kontrak publik output AI service. Versi dikunci di schema_version."""
    schema_version: Literal["1.0"] = "1.0"
    input_type: InputType
    risk_level: RiskLevel
    confidence: float = Field(ge=0, le=1)
    needs_manual_check: bool
    summary: str
    extracted: Extracted
    red_flags: list[RedFlag]
    fingerprint: Fingerprint
    meta: Meta

    @model_validator(mode="after")
    def level_coherent_with_flags(self) -> "AnalysisResult":
        """Penjaga dasar: risk_level 'aman' tidak boleh punya flag severity 'bahaya'."""
        if self.risk_level == "aman" and any(f.severity == "bahaya" for f in self.red_flags):
            raise ValueError(
                "risk_level 'aman' tidak konsisten: ada red flag dengan severity 'bahaya'"
            )
        return self


# ─── Kode error 422 (bukan lowongan / teks tidak ditemukan) ───────────────────
class AnalysisError(BaseModel):
    """Dikembalikan sebagai HTTP 422 ketika input tidak bisa dianalisis."""
    error_code: Literal["no_text_found", "not_a_job_posting", "low_quality_image"]
    message: str   # pesan teknis; UI menerjemahkan error_code ke bahasa pengguna
