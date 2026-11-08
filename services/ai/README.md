# CekLoker — Layanan Analisis AI

Layanan analisis berbasis Python FastAPI. Menerima screenshot lowongan/chat perekrut
dan/atau teks, lalu mengembalikan `AnalysisResult` (kontrak di `schema.py`).

## Alur

gambar/teks → model (`RawAnalysis`) → pengayaan dari `catalog/redflags.json`
(label, severity, dasar hukum) → skor risiko dihitung kode (`scoring.py`) → `AnalysisResult`.

Model hanya mengisi kode red flag, kutipan, alasan, kotak bukti, dan transkripsi.
Tingkat risiko TIDAK ditentukan model.

## Menjalankan

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # isi OPENROUTER_API_KEY (atau GEMINI_API_KEY)
uvicorn main:app --reload --port 8000
```

Dokumentasi interaktif: http://localhost:8000/docs

## Tes

```bash
python3 -m pytest -q
```

`test_analyzer.py` tidak memanggil model sungguhan.

## Batas input

Maksimal 3 gambar (JPG/PNG/WEBP), 10 MB per gambar, 10.000 karakter teks.
Input yang tidak bisa dianalisis dijawab HTTP 422 dengan `error_code`
(`no_text_found`, `not_a_job_posting`, `low_quality_image`).

Variabel lingkungan lengkap ada di `.env.example`.
