# CekLoker — Layanan Analisis AI

Layanan analisis cerdas CekLoker berbasis Python FastAPI.

## Fitur Layanan:

- Ekstraksi informasi lowongan kerja (OCR & teks)
- Deteksi indikator tanda bahaya (_red flags_) berbasis Gemini AI
- Penentuan koordinat visual (_box_2d_) untuk penanda bukti
- Kalkulasi skor risiko (Aman, Waspada, Bahaya)

## Cara Menjalankan:

1. Pastikan Python 3.10+ terinstal.
2. Pasang dependensi:
   ```bash
   pip install -r requirements.txt
   ```
3. Siapkan API Key Gemini di `.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Jalankan server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
5. Buka dokumentasi Swagger interaktif di: `http://localhost:8000/docs`
