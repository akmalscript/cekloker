# CekLoker — Cek Dulu Sebelum Melamar

Aplikasi berbasis AI untuk membantu pencari kerja mendeteksi lowongan kerja mencurigakan, penipuan (_scam_), atau TPPO melalui analisis screenshot lowongan, teks, dan percakapan rekruter dengan penanda bukti visual (_red flags_).

---

## Struktur Repositori (Monorepo)

```text
cekloker/
├── catalog/                     # Sumber kebenaran katalog indikasi red flag (redflags.json)
├── docs/                        # Dokumen SRS (Software Requirements Specification) & referensi
│   └── SRS-Aplikasi-CekLoker.pdf
├── prototypes/                  # Prototipe UI mandiri (Mono HTML & Tailwind)
│   ├── DESAIN.md                # Panduan Design System CekLoker
│   ├── index.html               # Landing page interaktif
│   ├── cekloker.html            # Halaman periksa lowongan
│   ├── hasil-pemeriksaan.html   # Hasil evaluasi risiko AI
│   ├── result.html              # Hasil scan AI dengan bounding box interaktif
│   ├── login.html               # Halaman masuk
│   ├── daftar-akun.html         # Halaman pendaftaran
│   └── README.md
├── apps/
│   └── web/                     # Aplikasi Web Full-Stack (Akmal & Dhimas)
│       └── README.md
├── services/
│   └── ai/                      # Layanan Analisis AI FastAPI (Regina)
│       ├── requirements.txt
│       └── README.md
└── README.md
```

---

## Panduan Memulai Cepat

Proyek ini terdiri dari dua layanan utama yang dijalankan secara bersamaan di terminal terpisah:
1. **Layanan AI (FastAPI)** pada port `8000`
2. **Aplikasi Web Full-Stack (Next.js)** pada port `3000`

---

### 1. Menjalankan Layanan AI (FastAPI)

Layanan backend untuk ekstraksi OCR dan deteksi *red flags*:

```bash
cd services/ai

# 1. Buat & aktifkan virtual environment
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

# 2. Pasang dependensi
pip install -r requirements.txt

# 3. Konfigurasi environment (isi API Key Gemini/OpenRouter)
cp .env.example .env

# 4. Jalankan server pengembangan
uvicorn main:app --reload --port 8000
```

> Akses dokumentasi interaktif Swagger UI di [http://localhost:8000/docs](http://localhost:8000/docs).

---

### 2. Menjalankan Aplikasi Web (Next.js)

Aplikasi frontend dan backend web berbasis Next.js (App Router):

```bash
cd apps/web

# 1. Pasang dependensi
npm install

# 2. Konfigurasi environment (sesuaikan URL database & AI service)
cp .env.example .env.local

# 3. Siapkan Prisma Client
npx prisma generate

# 4. Jalankan server pengembangan
npm run dev
```

> Akses antarmuka aplikasi web di [http://localhost:3000](http://localhost:3000).

---

### Catatan Tambahan

- **Sinkronisasi Tipe Kontrak API AI:**  
  Jika ada pembaruan skema pada `services/ai`, pastikan service AI berjalan lalu perbarui tipe TypeScript di `apps/web` dengan:
  ```bash
  cd apps/web
  npm run typegen
  ```
- **Prototipe Desain Mandiri (`prototypes/`):**  
  Berkas HTML statis di dalam folder `prototypes/` tetap dapat dibuka langsung di peramban untuk referensi desain antarmuka.

---
