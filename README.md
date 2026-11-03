# CekLoker — Cek Dulu Sebelum Melamar

Aplikasi berbasis AI untuk membantu pencari kerja mendeteksi lowongan kerja mencurigakan, penipuan (*scam*), atau TPPO melalui analisis screenshot lowongan, teks, dan percakapan rekruter dengan penanda bukti visual (*red flags*).

---

## Tim Pengembang
- **Akmal Pratama** — Full-Stack Web Developer
- **Dhimas** — Full-Stack Web Developer
- **Regina** — AI Engineer

---

## Struktur Repositori (Monorepo)

```text
cekloker/
├── docs/                        # Dokumen SRS (Software Requirements Specification) & referensi
│   └── SRS-Aplikasi-CekLoker.pdf
├── prototypes/                  # Prototipe UI mandiri (Mono HTML & Tailwind)
│   ├── DESAIN.md                # Panduan Design System CekLoker
│   ├── index.html               # Landing page interaktif
│   ├── login.html               # Halaman masuk
│   ├── register.html            # Halaman pendaftaran
│   └── README.md
├── apps/
│   └── web/                     # Aplikasi Web Full-Stack (Akmal & Dhimas)
│       └── README.md
├── services/
│   └── ai/                      # Layanan Analisis AI FastAPI (Regina)
│       ├── app/
│       ├── requirements.txt
│       └── README.md
└── README.md
```

---

## Panduan Memulai Cepat

### 1. Menjalankan Prototipe Antarmuka
Buka berkas di folder `prototypes/` langsung di peramban web:
- `prototypes/index.html` — Landing page
- `prototypes/login.html` — Halaman masuk
- `prototypes/register.html` — Halaman daftar

### 2. Menjalankan Layanan AI (FastAPI)
```bash
cd services/ai
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Buka `http://localhost:8000/docs` untuk menguji endpoint analisis via Swagger UI.
