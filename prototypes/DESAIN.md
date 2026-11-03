# CekLoker — Panduan Design System

Panduan untuk tim yang membangun halaman CekLoker berikutnya. Acuan visual: `index.html` (landing page) dan `login.html` (halaman masuk).
Arah visual: **"Teliti, tenang, tepercaya."**

Setiap halaman berdiri sendiri, tanpa file CSS/JS bersama. Untuk membuat halaman baru, salin `<head>` dari `index.html` atau `login.html`. Isinya, berurutan:

1. Link Google Fonts (Plus Jakarta Sans).
2. `<style id="ck-design-system">`: token warna (CSS variable `--ck-*`), gaya dasar, dan semua kelas komponen.
3. `<script src="https://cdn.tailwindcss.com">`.
4. `<script id="ck-tailwind-config">`: warna, radius, bayangan, dan breakpoint utilitas Tailwind (`bg-navy`, `text-muted`, `short:`, dst.).

Blok `ck-design-system` dan `ck-tailwind-config` identik di semua halaman. Salin keduanya tanpa diubah.

Ikon memakai Lucide. Muat di akhir `<body>`, lalu panggil `lucide.createIcons()`:

```html
<script src="https://unpkg.com/lucide@1.66.0/dist/umd/lucide.min.js"></script>
<script>lucide.createIcons();</script>
```

---

## Aturan wajib

1. **Merah hanya untuk red flag dan status Bahaya.** Satu-satunya pengecualian adalah pesan error di form. Jangan pakai merah untuk dekorasi, tombol, atau penekanan biasa.
2. **Status selalu warna + ikon + teks.** Pakai `.badge-aman` (ikon `shield-check`), `.badge-waspada` (`triangle-alert`), atau `.badge-bahaya` (`octagon-alert`). Jangan menampilkan status hanya dengan warna.
3. **Satu tombol utama (`.btn-primary`) per layar.** Aksi lain memakai `.btn-secondary` atau `.btn-ghost`. Di atas latar navy, pakai `.btn-white`.
4. **Jarak kelipatan 8 px** (Tailwind `2`, `4`, `6`, `8`, `10`, `12`, `16`, …). Langkah 4 px hanya untuk detail kecil seperti badge dan label.
5. **Jangan pakai emas, neon, gradasi mencolok, atau ikon uang/koin.** Juga hindari foto stok, emoji, dan font dekoratif. Visual dibangun dari mockup UI.
6. **Pakai token dan kelas dari blok `ck-design-system`.** Jangan menulis kode hex baru di halaman. Kalau butuh warna atau komponen baru, tambahkan ke blok `ck-design-system` di **semua** halaman (isinya harus tetap identik), lalu catat di panduan ini.
7. **Aksesibilitas tidak boleh turun.** Setiap input punya `<label>`, fokus keyboard selalu terlihat, kontras teks minimal WCAG AA, dan animasi dimatikan saat `prefers-reduced-motion` aktif.

---

## Alasan desain

1. **Tenang, bukan menakut-nakuti.** Penggunanya sedang cemas soal lowongan yang mencurigakan. Karena itu halaman didominasi putih dan abu sangat terang, dengan banyak ruang kosong. Merah hanya muncul di titik yang benar-benar berbahaya, jadi tanda bahaya justru lebih mudah terlihat.

2. **Motif "penanda bukti" sebagai identitas.** Kotak bergaris merah dengan label kecil meniru cara orang menandai bukti di atas dokumen. Motif ini muncul di hero, Cara Kerja (langkah 2), Contoh hasil, logo (bingkai bidik), dan ikon fitur. Pesan yang terus diulang: CekLoker **menunjukkan buktinya**, bukan sekadar memberi skor.

3. **Langsung menunjukkan, tidak sekadar bercerita.** Hero memperlihatkan poster fiktif yang sedang dipindai. Garis pindai turun, empat kotak penanda muncul satu per satu (gaji tidak wajar, visa turis, penahanan paspor, pindah ke Telegram), dan kartu "Hasil pemeriksaan" ikut terisi bertahap. Setelah itu muncul badge Bahaya. Animasi hanya berjalan sekali lalu berhenti di kondisi akhir, sehingga halaman tetap tenang dan tidak berkedip terus. Tombol putar ulang tersedia di pojok poster. Visual ini dibuat dari HTML/CSS, bukan foto stok, sehingga tetap tajam dan bebas masalah lisensi.

4. **Bahasa visual fintech/keamanan digital.** Navy solid, kartu putih dengan border tipis, bayangan halus, dan radius 12 px. Kami sengaja menghindari emas, neon, gradasi mencolok, dan ikon uang karena kesannya mirip situs judi atau pinjol, padahal itulah ekosistem yang ingin dilawan CekLoker.

5. **Status = warna + ikon + teks.** Aman (perisai centang), Waspada (segitiga), dan Bahaya (oktagon bertanda seru) selalu tampil dengan label teks. Pengguna buta warna atau yang melihat cetakan hitam-putih tetap bisa membedakannya. Warna kotak penanda juga mengikuti tingkat risiko: oranye di kartu Waspada, merah di kartu Bahaya.

6. **Jujur soal batasan.** Hasil disebut sebagai "indikasi risiko", FAQ pertama menjawab "Tidak" untuk pertanyaan "pasti benar?", dan ada kotak peringatan sebelum footer. Bagi juri, ini menunjukkan tanggung jawab. Bagi pengguna, ini membangun kepercayaan jangka panjang.

7. **Aksi utama jelas, akun tidak wajib.** Di navbar, aksi utama adalah tombol "Cek Loker", sedangkan "Masuk" cukup jadi tautan teks. Halaman ditutup dengan panel navy "Ragu dengan sebuah lowongan?" yang memberi satu langkah jelas, dengan bracket bidik putih tipis sebagai gema motif penanda tanpa memakai merah. Halaman login dibuat satu kolom di tengah, di atas pola grid yang sama dengan hero. Jalur tamu ("Belum mau daftar? Cek tanpa login") ditaruh di kotak biru muda terpisah di bawah kartu, gayanya sengaja dibedakan dari tombol Google.

8. **Aksesibel sejak awal.** Ada skip link, urutan heading yang benar, label di setiap input, pesan error yang terhubung lewat `aria-describedby`, fokus keyboard yang selalu terlihat, akordeon dengan `aria-expanded`, animasi pindai yang hanya berjalan sekali (di bawah 5 detik), serta dukungan `prefers-reduced-motion` (animasi dimatikan, keempat penanda dan hasil akhir langsung tampil). Pasangan warna teks utama sudah dicek kontrasnya (WCAG AA).

9. **Mobile-first.** Layout dasar ditulis untuk layar sempit, lalu melebar di breakpoint yang lebih besar. Di lebar 360 px:
   - **Navbar:** tautan disembunyikan dan diganti tombol hamburger. Menunya berisi Cara Kerja, Fitur, FAQ, tautan teks "Masuk", dan tombol "Cek Loker" selebar layar. Menu tertutup saat salah satu tautan diklik atau tombol Esc ditekan. Navbar baru tampil lengkap mulai 768 px.
   - **Hero:** satu kolom dengan judul 40 px. Tombol "Cek Loker Sekarang" dan "Lihat Cara Kerja" bertumpuk selebar layar, lalu berdampingan mulai 640 px.
   - **Kartu hasil:** kartu "Hasil pemeriksaan" ada di bawah poster, selebar layar, dan tidak menumpuk di atasnya. Poster dan kartu baru berdampingan mulai 768 px. Kartu di Cara Kerja, Fitur, dan Contoh hasil juga tampil satu kolom sampai 768 px.
   - **Login:** tautan "← Beranda" berada di atas logo dan tidak melayang di pojok, dan kartu form memakai padding 24 px. Isi kotak "Belum mau daftar?" bertumpuk: teks, keterangan, lalu tombol "Cek tanpa login →" di baris sendiri.
   - **Tanpa scroll horizontal:** kedua halaman sudah diukur di 360 px, dan lebar kontennya tidak melebihi layar.

---

## Warna

| Token | Hex | Dipakai untuk |
|---|---|---|
| Navy utama | `#1E3A8A` | Tombol utama, tautan, teks penting, panel ajakan penutup |
| Navy hover | `#172F70` | Hover tombol utama |
| Navy tint | `#EEF2FB` | Latar ikon, hover ghost, kotak info |
| Latar | `#F8FAFC` | Latar halaman |
| Teks utama | `#0F172A` | Judul dan isi |
| Teks sekunder | `#475569` | Deskripsi, keterangan |
| Border | `#E2E8F0` | Kartu, pemisah |
| Border input | `#8792A6` | Garis tepi input (kontras 3,1:1 sesuai WCAG non-teks) |
| Aman | `#16A34A` (teks `#15803D`, latar `#F0FDF4`) | Status Aman |
| Waspada | `#D97706` (teks `#B45309`, latar `#FFFBEB`) | Status Waspada |
| Bahaya | `#DC2626` (teks `#B91C1C`, latar `#FEF2F2`) | Status Bahaya, kotak red flag, pesan error form |

Catatan: hijau `#16A34A` dan oranye `#D97706` hanya mencapai kontras ±3,2:1 terhadap putih. Keduanya cukup untuk ikon dan garis, tetapi tidak untuk teks kecil. Karena itu teks badge memakai versi yang lebih gelap, dan rasionya tetap ≥ 4,7:1.

Pengecualian sadar: pesan error per field di form login memakai merah karena sudah menjadi konvensi universal dan memang menandakan "ada yang salah".

## Tipografi

- **Plus Jakarta Sans** (Google Fonts, lisensi OFL), bobot 400–800.
- Judul: 700–800, tracking rapat. H1 40 px (HP) sampai 56 px (desktop).
- Isi: 16 px reguler, tinggi baris 1,7.
- Label kecil (badge, label penanda): 11–13 px bold.

## Sistem lainnya

- Jarak kelipatan 8 px (setengah langkah 4 px hanya untuk detail kecil seperti badge).
- Radius: kartu 12 px, tombol/input 10 px, badge penuh (pill).
- Interaksi: kartu naik 2 px saat hover dengan bayangan sedikit lebih tegas, transisi 180 ms.
- Komponen yang dipakai ulang didefinisikan di blok `<style id="ck-design-system">`, identik di setiap halaman (lihat Catatan teknis): `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-white` (di atas navy), `.spinner`, `.input` + `.field-label` + `.field-error`, `.card` + `.card-hover`, `.badge-aman/-waspada/-bahaya`, `.alert-info/-success/-error`, `.evidence` + `.evidence-box` (penanda bukti), `.viewfinder`, `.grid-paper` / `.grid-paper-navy` (pola grid tipis), `.container-page`, `.nav-link`, `.eyebrow`, `.skeleton`. Navbar dan footer belum dijadikan komponen; salin markup-nya dari `index.html`.
- Breakpoint tambahan `short:` (lebar ≥ 640 px dan tinggi ≤ 820 px) untuk merapatkan jarak di laptop berlayar pendek.
- Ikon: Lucide (lisensi ISC). Logo dan ikon "G" pada tombol Google digambar sendiri, tanpa aset resmi.

---

## Contoh komponen

Potongan berikut disalin langsung dari `index.html` dan `login.html`. Kelas `short:` dan ukuran margin bersifat kontekstual; sesuaikan bila perlu.

### Tombol utama dan tombol kedua

```html
<a href="login.html" class="btn btn-primary">
  Cek Loker Sekarang
  <i data-lucide="arrow-right" class="h-5 w-5" aria-hidden="true"></i>
</a>
<a href="#cara-kerja" class="btn btn-secondary">Lihat Cara Kerja</a>
```

Tombol submit dengan indikator loading (`login.html`). Saat loading, hapus `hidden` dari `.spinner`, ganti teks label, lalu set `disabled`:

```html
<button id="submit-btn" type="submit" class="btn btn-primary w-full short:min-h-[40px]">
  <span class="spinner hidden" aria-hidden="true"></span>
  <span data-label>Masuk</span>
</button>
```

### Input dengan label dan pesan error

```html
<label for="email" class="field-label">Email</label>
<input id="email" name="email" type="email" class="input mt-2 short:mt-1 short:h-10" autocomplete="email" inputmode="email" placeholder="nama@email.com" aria-invalid="false">
<p id="email-error" class="field-error hidden"><i data-lucide="circle-alert" aria-hidden="true"></i><span></span></p>
```

Untuk menampilkan error: isi teks di `<span>`, hapus kelas `hidden`, set `aria-invalid="true"` pada input, dan tambahkan `aria-describedby="email-error"`. Fungsi `setFieldError()` di `login.html` sudah melakukan keempat langkah ini.

### Badge status risiko

```html
<span class="badge badge-aman"><i data-lucide="shield-check"></i>Aman</span>
<span class="badge badge-waspada"><i data-lucide="triangle-alert"></i>Waspada</span>
<span class="badge badge-bahaya"><i data-lucide="octagon-alert"></i>Bahaya</span>
```

### Kotak penanda bukti

Pada teks (hero `index.html`). Kelas `anim-in` dan `style="--d:…"` hanya untuk animasi pindai di hero; hapus keduanya untuk penanda statis:

```html
<span class="evidence">
  Paspor dititipkan ke agen
  <span class="evidence-box is-roomy anim-in" style="--d:3.15s"><span class="evidence-label"><span class="sr-only">Tanda bahaya: </span>Penahanan paspor</span></span>
</span>
```

Varian: `.evidence-box` biasa (merah, jarak rapat), `.is-roomy` (jarak lebih lega untuk teks), `.is-waspada` (oranye), dan `.is-aman` (hijau):

```html
<span class="evidence-box is-waspada"><span class="evidence-label">Gaji tidak wajar</span></span>
```

---

## Catatan teknis

**Blok design system di setiap halaman**

- Setiap halaman berdiri sendiri dan bisa dibuka langsung tanpa file lain. Konsekuensinya, blok `ck-design-system` dan `ck-tailwind-config` diulang di setiap halaman. Setiap perubahan harus diterapkan ke semua halaman supaya isinya tetap identik.
- Blok `ck-design-system` ditulis sebagai CSS biasa berbasis CSS variable, bukan `@apply`, sehingga isinya bisa langsung dipindah ke file `.css` saat build.
- Gaya khusus halaman, seperti animasi pindai hero dan akordeon FAQ, berada di `<style>` terpisah di halaman itu saja.
- Urutan penting: blok `ck-design-system` harus berada sebelum script Tailwind CDN. Reset bawaan Tailwind sengaja ditimpa lewat selector `html body`, `html :is(h1,h2,h3)`, dan `.btn.btn-*`. Jangan menurunkan spesifisitas selector itu.

**Build produksi** (prototipe sekarang masih memakai CDN):

- **Tailwind dikompilasi** dengan Tailwind CLI atau PostCSS, bukan Play CDN. Pindahkan isi blok `ck-tailwind-config` ke `tailwind.config.js` (sebagai `module.exports`) dan isi blok `ck-design-system` ke satu file CSS. Isi `content` dengan semua file HTML/JS agar kelas yang tidak dipakai dibuang.
- **Font di-host sendiri.** Unduh Plus Jakarta Sans (lisensi OFL) dalam format `.woff2`, deklarasikan dengan `@font-face` dan `font-display: swap`, lalu hapus link Google Fonts.
- **Ikon di-bundle.** Impor hanya ikon Lucide yang dipakai lewat paket npm `lucide` (atau salin sebagai SVG inline), tidak memuat seluruh pustaka dari unpkg.

---

## Halaman yang perlu dibuat berikutnya

- **Halaman unggah dan hasil pemeriksaan**: poster asli dengan penanda bukti yang bisa diklik untuk membaca alasannya, beserta saran langkah berikutnya.
- **Halaman daftar akun dan lupa password** dengan pola form yang sama seperti `login.html`.
- **Riwayat pemeriksaan dan alur "Laporkan loker ini"** untuk pengguna yang sudah masuk.
