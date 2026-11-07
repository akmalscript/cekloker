# CekLoker — Web Application

Aplikasi web full-stack CekLoker berbasis **Next.js (App Router, TypeScript, Tailwind CSS)** yang diintegrasikan dengan layanan AI di `services/ai`.

## Tech Stack
- **Framework**: Next.js (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & Design System CekLoker (`prototypes/DESAIN.md`)
- **Ikon**: Lucide Icons (`lucide-react`)
- **Kontrak API AI**: Otomatis di-generate dari OpenAPI `services/ai` ke `src/types/api.ts`

## Cara Menjalankan

1. Masuk ke direktori web:
   ```bash
   cd apps/web
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```

Akses aplikasi di: [http://localhost:3000](http://localhost:3000)

## Sinkronisasi Kontrak API AI
Pastikan layanan `services/ai` berjalan di port 8000, lalu jalankan:
```bash
npm run typegen
```
