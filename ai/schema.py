"""Bentuk JSON yang dikembalikan model. KONTRAK dengan tim full stack:
jangan ubah nama field tanpa kabar ke Dimas dan satunya.

Catatan teknis: sengaja tanpa nilai default supaya kompatibel dengan
response_schema Gemini. Field yang tidak ada di gambar diisi null.
"""
from typing import Optional
from pydantic import BaseModel
from redflags import RedFlagCode


class JobInfo(BaseModel):
    posisi: Optional[str]
    perusahaan: Optional[str]
    negara_atau_lokasi: Optional[str]
    gaji: Optional[str]
    persyaratan: list[str]
    kontak: list[str]
    biaya_diminta: Optional[str]


class RedFlag(BaseModel):
    kode: RedFlagCode
    alasan: str              # penjelasan singkat, bahasa Indonesia
    bukti_teks: str          # kutipan persis dari gambar/teks
    gambar_ke: Optional[int]  # indeks gambar (mulai 0); null bila dari teks
    box_2d: Optional[list[int]]  # [ymin, xmin, ymax, xmax], skala 0-1000


class AnalysisResult(BaseModel):
    info: JobInfo
    red_flags: list[RedFlag]
    keyakinan: float         # 0.0-1.0
    ringkasan: str
