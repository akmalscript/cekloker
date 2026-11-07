"""Endpoint untuk tim full stack.

Jalankan: uvicorn main:app --reload --port 8000
Uji     : buka http://localhost:8000/docs
"""
import os
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from analyzer import analisis
from schema import AnalysisResult

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

app = FastAPI(title="CekLoker AI")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

FORMAT_OK = {"image/jpeg", "image/png", "image/webp"}
MAKS_BYTE = 5 * 1024 * 1024  # 5 MB per file (FR-LOK-03)


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/analyze", response_model=AnalysisResult)
async def analyze(
    files: list[UploadFile] = File(default=[]),
    teks: str | None = Form(default=None),
) -> AnalysisResult:
    if not files and not teks:
        raise HTTPException(400, "Kirim minimal satu gambar atau teks.")
    if len(files) > 5:
        raise HTTPException(400, "Maksimal 5 gambar.")

    gambar = []
    for f in files:
        if f.content_type not in FORMAT_OK:
            raise HTTPException(400, f"Format {f.content_type} tidak didukung (JPG, PNG, WEBP).")
        data = await f.read()
        if len(data) > MAKS_BYTE:
            raise HTTPException(400, f"{f.filename} lebih dari 5 MB.")
        gambar.append((data, f.content_type))

    try:
        return analisis(gambar, teks)
    except Exception as e:
        raise HTTPException(502, f"Layanan AI gagal: {e}")
