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

### 1. Menjalankan Prototipe Antarmuka

Buka berkas di folder `prototypes/` langsung di peramban web:

- `prototypes/index.html` — Landing page
- `prototypes/cekloker.html` — Form periksa lowongan
- `prototypes/hasil-pemeriksaan.html` & `prototypes/result.html` — Hasil pemeriksaan & anotasi bukti visual
- `prototypes/login.html` & `prototypes/daftar-akun.html` — Alur masuk & pendaftaran akun

### 2. Menjalankan Layanan AI (FastAPI)

```bash
cd services/ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Buka `http://localhost:8000/docs` untuk menguji endpoint analisis via Swagger UI.

---
