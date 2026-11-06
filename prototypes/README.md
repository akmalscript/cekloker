# CekLoker — Prototipe Antarmuka (Mono HTML)

Folder ini berisi prototipe mandiri (mono HTML) untuk mematangkan alur antarmuka dan interaksi sebelum diintegrasikan ke dalam framework web.

## Berkas yang Tersedia:

### Panduan & Desain
- [`DESAIN.md`](DESAIN.md): Panduan sistem desain resmi (*tokens, layout, rules, accessibility*).
- [`img/`](img/): Aset gambar sampel poster loker (*scam* & resmi) untuk pengujian anotasi visual.

### Beranda & Alur Pemeriksaan
- [`index.html`](index.html): Halaman utama (*Landing Page*) interaktif dengan demo pemindaian hero.
- [`cekloker.html`](cekloker.html): Halaman periksa lowongan (unggah poster/dokumen/tangkapan layar chat dan formulir input teks).
- [`hasil-pemeriksaan.html`](hasil-pemeriksaan.html): Halaman hasil evaluasi tingkat risiko AI komprehensif dengan rincian bukti red flag dan rekomendasi tindakan.
- [`result.html`](result.html): Halaman hasil pemindaian AI dengan visualisasi kotak bukti (*bounding box* red flag) interaktif 2-arah.
- [`riwayat-pemeriksaan.html`](riwayat-pemeriksaan.html): Halaman daftar riwayat pemeriksaan lowongan pengguna.

### Autentikasi & Akun
- [`login.html`](login.html): Halaman masuk dengan validasi form dan simulasi respon.
- [`daftar-akun.html`](daftar-akun.html): Halaman registrasi akun baru (alur pendaftaran resmi terkini).
- [`register.html`](register.html): Halaman pendaftaran awal (*legacy*).
- [`lupa-password-a.html`](lupa-password-a.html): Alur lupa password tahap 1 (masukkan email pemulihan).
- [`lupa-password-b.html`](lupa-password-b.html): Alur lupa password tahap 2 (instruksi verifikasi cek email).
- [`lupa-password-c.html`](lupa-password-c.html): Alur lupa password tahap 3 (masukkan password baru).
- [`lupa-password-d.html`](lupa-password-d.html): Alur lupa password tahap 4 (konfirmasi password berhasil diubah).
- [`tautan-kedaluwarsa.html`](tautan-kedaluwarsa.html): Halaman status tautan reset password yang sudah kedaluwarsa.

### Pelaporan & Basis Data Komunitas
- [`laporkan-loker-ini.html`](laporkan-loker-ini.html): Formulir pelaporan indikasi lowongan kerja penipuan kepada komunitas/pengawas.
- [`database-loker.html`](database-loker.html): Direktori pencarian basis data lowongan yang dilaporkan dan diverifikasi.

### Moderasi Admin
- [`laporan-masuk.html`](laporan-masuk.html): Antrean laporan indikasi penipuan masuk untuk ditinjau admin.
- [`tinjau-laporan.html`](tinjau-laporan.html): Halaman peninjauan detail laporan pengguna dan penetapan keputusan moderasi.

### Legal & Kepatuhan
- [`kebijakan-privasi.html`](kebijakan-privasi.html): Halaman kebijakan privasi dan perlindungan data PII pengguna.
- [`syarat-layanan.html`](syarat-layanan.html): Halaman syarat dan ketentuan layanan serta batasan tanggung jawab hukum.

## Interaktivitas `result.html`:

- **Preset Data Evaluasi AI**: Menggunakan data nyata dari `services/ai/hasil_eval.json` (Contoh 1: CS Kamboja - Bahaya TPPO, Contoh 2: Perawat Jepang - Resmi P3MI Aman, Contoh 3: Pabrik Taiwan - Waspada).
- **Anotasi Bounding Box 2-Arah**: Mengklik kotak penanda di poster langsung mengarahkan dan menyorot kartu red flag di sebelah kanan, dan sebaliknya.
- **Verifikasi Jalur Resmi (BP2MI / Kemnaker)**: Menampilkan status keterdaftaran perusahaan P3MI dan tautan langsung ke portal resmi.
- **Rekomendasi Tindakan & Unduh PDF**: Tombol aksi darurat, lapor loker, dan cetak dokumen PDF.
