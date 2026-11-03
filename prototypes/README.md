# CekLoker — Prototipe Antarmuka (Mono HTML)

Folder ini berisi prototipe mandiri (mono HTML) untuk mematangkan alur antarmuka dan interaksi sebelum diintegrasikan ke dalam framework web.

## Berkas yang Tersedia:

- [`DESAIN.md`](file:///D:/Projects/laragon/www/cekloker/prototypes/DESAIN.md): Panduan sistem desain resmi (_tokens, layout, rules, accessibility_).
- [`index.html`](file:///D:/Projects/laragon/www/cekloker/prototypes/index.html): Halaman utama (Landing Page) interaktif dengan demo pemindaian hero.
- [`login.html`](file:///D:/Projects/laragon/www/cekloker/prototypes/login.html): Halaman masuk dengan validasi form dan simulasi respon.
- [`register.html`](file:///D:/Projects/laragon/www/cekloker/prototypes/register.html): Halaman pendaftaran akun baru dengan validasi konfirmasi password.
- [`result.html`](file:///D:/Projects/laragon/www/cekloker/prototypes/result.html): Halaman unggah gambar/teks dan hasil pemindaian AI dengan visualisasi kotak bukti (_bounding box_ red flag) interaktif 2-arah.

## Interaktivitas `result.html`:

- **Preset Data Evaluasi AI**: Menggunakan data nyata dari `services/ai/hasil_eval.json` (Contoh 1: CS Kamboja - Bahaya TPPO, Contoh 2: Perawat Jepang - Resmi P3MI Aman, Contoh 3: Pabrik Taiwan - Waspada).
- **Anotasi Bounding Box 2-Arah**: Mengklik kotak penanda di poster langsung mengarahkan dan menyorot kartu red flag di sebelah kanan, dan sebaliknya.
- **Verifikasi Jalur Resmi (BP2MI / Kemnaker)**: Menampilkan status keterdaftaran perusahaan P3MI dan tautan langsung ke portal resmi.
- **Rekomendasi Tindakan & Unduh PDF**: Tombol aksi darurat, lapor loker, dan cetak dokumen PDF.
