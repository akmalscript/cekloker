# Agent Guidelines — CekLoker

This document outlines instructions and standards for AI coding assistants working in the **CekLoker** repository.

---

## 1. Git Commit Message Conventions

All agents **MUST** follow a strict conventional commit format **without scopes**. Consistency is essential for clean collaboration and history readability.

### Format

```text
<type>: <short imperative description>

[optional longer description / body explaining why and what changed]
```

### Strict Rules

1. **NEVER use scopes in parentheses (`(scope)`):**
   - ✅ **CORRECT:** `feat: add result.html prototype with interactive red flag bounding boxes`
   - ❌ **INCORRECT:** `feat(proto): add result.html prototype with interactive red flag bounding boxes`
   - ❌ **INCORRECT:** `feat(ui): add result.html ...`
   - ❌ **INCORRECT:** `fix(api): handle missing image upload ...`
2. **Use imperative mood in lowercase** for the commit subject:
   - Use `"add"`, `"fix"`, `"update"`, `"remove"`, `"refactor"`.
   - Avoid past tense (`"added"`, `"fixed"`) or third-person (`"adds"`, `"fixes"`).
3. **No trailing punctuation:** Do not end the commit subject with a period (`.`).
4. **Subject line length:** Keep the first line under 72 characters when possible.
5. **Body (optional):** If additional context is needed, separate the subject from the body with a blank line.

### Allowed Types

| Type       | Usage                                                     | Example                                                     |
| :--------- | :-------------------------------------------------------- | :---------------------------------------------------------- |
| `feat`     | New feature or user-facing addition                       | `feat: add interactive bounding boxes for scam flags`       |
| `fix`      | Bug fix or visual correction                              | `fix: correct red flag badge alignment on mobile screens`   |
| `docs`     | Documentation changes only                                | `docs: update setup steps in services/ai readme`            |
| `style`    | Formatting or styling without logic changes               | `style: reformat tailwind classes in login page`            |
| `refactor` | Code restructuring without adding features or fixing bugs | `refactor: simplify bounding box coordinate calculation`    |
| `perf`     | Performance improvements                                  | `perf: optimize image preprocessing before model inference` |
| `test`     | Adding or modifying tests                                 | `test: add unit test for gemini scam analysis parser`       |
| `chore`    | Maintenance, configuration, dependencies, or tooling      | `chore: update python dependencies in services/ai`          |

---

## 2. Git Branching Workflow

All agents **MUST** create a new branch before making any changes. **Never commit directly to `main`.**

### Branch Naming Convention

```text
<type>/<short-kebab-description>
```

**Examples:**

- `feat/add-ocr-image-upload`
- `fix/correct-red-flag-badge-alignment`
- `docs/update-ai-service-readme`
- `refactor/simplify-bounding-box-logic`
- `chore/update-python-dependencies`

The `<type>` prefix must match one of the allowed commit types (see Section 1).

### Branching Rules

1. **Always branch off `main`** unless instructed otherwise:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b <type>/<short-description>
   ```
2. **One branch per feature/fix/task.** Do not bundle unrelated changes into a single branch.
3. **Push the branch** and open a Pull Request to `main` when work is complete:
   ```bash
   git push origin <type>/<short-description>
   ```
4. **Never force-push to `main`.** Only force-push on your own feature branch if necessary.
5. **Delete the branch** after it is merged.

---

## 3. Repository Overview & Architecture

- `catalog/`: Single source of truth for scam red flag indicators (`catalog/redflags.json`) with severity weights and legal bases.
- `prototypes/`: Standalone HTML + Tailwind CSS mockups/prototypes for fast UI testing and web slicing reference.
  - **Public / Landing:** `index.html`
  - **Job Check Flow:** `cekloker.html` (upload & text input), `hasil-pemeriksaan.html` (comprehensive risk analysis & legal actions), `result.html` (interactive 2-way red flag bounding boxes), `riwayat-pemeriksaan.html`
  - **Auth Flow:** `login.html`, `daftar-akun.html` (canonical registration), `lupa-password-a.html` to `lupa-password-d.html`, `tautan-kedaluwarsa.html`
  - **Reporting & Database:** `laporkan-loker-ini.html`, `database-loker.html`
  - **Admin Moderation:** `laporan-masuk.html` (queue), `tinjau-laporan.html` (review & decision)
  - **Legal:** `kebijakan-privasi.html`, `syarat-layanan.html`
- `apps/web/`: Web application frontend & backend.
- `services/ai/`: FastAPI microservice for AI scam detection and OCR analysis.
- `docs/`: Product documentation and SRS files.

---

## 4. Critical Product Rules (dari SRS)

Aturan berikut berasal langsung dari SRS dan **HARUS** dipatuhi. Melanggar aturan ini bisa berdampak privasi, hukum, atau merusak kepercayaan pengguna.

### Privacy — Blur PII Sebelum Dikirim ke AI (FR-PRI-01)

Sebelum gambar dikirim ke Gemini AI, **wajib blur** data pribadi sensitif:

- NIK, foto KTP, KK, Paspor, Ijazah
- Nomor rekening, alamat lengkap

```
[Upload] → [Blur PII] → [Kirim ke AI] ← urutan ini tidak boleh terbalik
```

> [!CAUTION]
> Jangan pernah mengirim data sensitif mentah ke API eksternal. Implementasikan blur di layer backend `apps/web/` sebelum memanggil `services/ai/`.

### Disclaimer Wajib di Setiap Hasil (FR-LOK-09, FR-LOK-10, FR-RSM-04)

Setiap halaman hasil **harus** menampilkan disclaimer. Di layer web/UI, teks disajikan secara kontekstual mengikuti prototipe dan SRS (bukan satu string kaku):

1. **Format Ringkas (Mobile `sm:hidden` / Banner Alert / Landing Page):**
   > _"Penting: Hasil analisis AI merupakan alat bantu pemeriksaan dan bukan keputusan hukum atau jaminan bahwa suatu lowongan pasti aman."_
   *(Rujukan: SRS Catatan Halaman 4, `prototypes/index.html`, `prototypes/hasil-pemeriksaan.html`)*

2. **Format Komprehensif (Desktop `sm:block` / Kartu Batasan Teknologi):**
   > _"Hasil analisis ini dibuat secara otomatis oleh model kecerdasan buatan (*AI Analysis Service*) berdasarkan pola indikasi risiko. Analisis ini merupakan alat bantu penilaian awal (*preliminary risk assessment*) dan bukan merupakan putusan hukum resmi atau jaminan mutlak. Selalu lakukan verifikasi mandiri melalui kanal resmi pemerintah sebelum mengambil keputusan kerja."_
   *(Rujukan: `prototypes/hasil-pemeriksaan.html`, `prototypes/result.html`)*

3. **Disclaimer Status Jalur Resmi (FR-RSM-04):**
   > _"Catatan penting: Status 'tidak ditemukan' pada basis data resmi bukan bukti bahwa suatu perusahaan otomatis ilegal/kriminal, melainkan menunjukkan ketiadaan jaminan pelindungan hukum ketenagakerjaan resmi dari negara RI."_
   *(Rujukan: SRS FR-RSM-04, `prototypes/result.html`)*

- Teks dasar dari backend `services/ai/analyzer.py` (`"Hasil ini adalah indikasi risiko dari alat bantu AI, bukan keputusan hukum dan bukan jaminan lowongan pasti aman atau pasti penipuan."`) adalah payload API, sedangkan antarmuka web menampilkan format di atas sesuai form-factor pengguna.

### Retensi Penyimpanan Hasil Pemeriksaan (FR-AKN, FR-PRI)

- **Mode Tamu (Tanpa Login):** Hasil pemeriksaan tersimpan di server selama **24 jam** (terikat pada token sesi/cookie tamu). Pengguna tamu dapat mengakses kembali halaman hasil selama tautan/sesi aktif dalam kurun waktu 24 jam. Setelah 24 jam, data otomatis kedaluwarsa dan dibersihkan dari server (*privacy compliance*) kecuali pengguna mendaftar akun untuk mengklaim riwayatnya.
- **Akun Terdaftar:** Hasil pemeriksaan tersimpan permanen di riwayat akun pengguna hingga pengguna menghapusnya secara mandiri sesuai hak privasi (FR-PRI-02).

### Tidak Boleh Kata "Pasti" (FR-LOK-09)

- ❌ **DILARANG:** `"lowongan ini pasti penipuan"`, `"pasti aman"`
- ✅ **BENAR:** `"terindikasi"`, `"berpotensi"`, `"ditemukan red flag"`

Aturan ini berlaku di semua layer: prompt AI, UI copy, komentar kode, dan dokumentasi.

### Rate Limit Pengguna Tanpa Login (FR-AKN-02)

Pengguna tanpa akun dibatasi **maksimal 3 kali cek per hari** (UI copy: *"Tamu bisa cek 3 kali per hari"* / *"Sisa jatah cek tanpa login: 3 dari 3"*). Implementasi ditegakkan di layer `apps/web/` (bukan di `services/ai/`).

- **Penegakan di Sisi Server (Strict Server-Side Enforcement):**
  - Validasi tidak boleh hanya mengandalkan *client-side storage* (localStorage/sessionStorage).
  - Wajib ditegakkan di server `apps/web/` menggunakan kombinasi **cookie penanda unik** (`guest_session_id`, `HttpOnly`, `SameSite=Lax`, TTL 24 jam) dan **pembatasan berbasis IP/Subnet** (sebagai *secondary anti-abuse* untuk mencegah bypass via penghapusan cookie atau manipulasi klien).
- **Aturan Pemotongan Jatah (*Commit on Success*):**
  - Pemotongan kuota hanya dilakukan setelah proses analisis AI berhasil selesai (**HTTP 200**).
  - Jika terjadi **error sistem** (HTTP 500, timeout) atau kesalahan berkas/input (HTTP 422: dokumen buram / bukan loker), **jatah cek tamu TIDAK boleh berkurang**.
- **Penanganan Kuota Habis:**
  - Jika kuota habis, server menolak request submit berikutnya (HTTP 429), form submit dinonaktifkan, dan UI memunculkan status/modal ajakan masuk (`login.html`) atau mendaftar akun (`daftar-akun.html`).

### CORS Production (bukan dev)

`services/ai/main.py` saat ini menggunakan `allow_origins=["*"]`. Sebelum deploy ke produksi, kunci ke domain resmi. **Jangan ubah ini secara lokal** — tandai dengan komentar `# TODO: kunci saat deploy`.

---

## 5. API Contract — services/ai

### Sumber Kebenaran

Jangan salin atau hardcode kontrak di sini — selalu mengacu ke:

- **Model Pydantic** → [`services/ai/schema.py`](services/ai/schema.py) — sumber kebenaran tunggal untuk tipe dan validasi.
- **Contoh JSON** → [`docs/contracts/`](docs/contracts/) — tiga contoh tervalidasi (`example_bahaya.json`, `example_waspada.json`, `example_aman.json`). Setiap perubahan schema harus diikuti update contoh; `test_schema.py` akan gagal kalau tidak.

### Endpoint

`POST /analyze` — menerima `files` (JPG/PNG/WEBP/PDF, maks 5 file, maks 10 MB/file, total maks 25 MB, PDF maks 10 halaman) dan `teks` (opsional, maks 10.000 karakter) sesuai validasi antarmuka di `prototypes/cekloker.html`.

Kalau input tidak bisa dianalisis (bukan lowongan, OCR kosong, gambar buram): kembalikan **HTTP 422** dengan `AnalysisError` yang berisi `error_code` (`no_text_found` / `not_a_job_posting` / `low_quality_image`). UI yang menerjemahkan kode ini ke pesan ramah — jangan kembalikan hasil palsu.

### Aturan Penting

> [!WARNING]
> **Nama field `schema.py` dikunci.** Jangan ubah tanpa koordinasi dengan `apps/web/` (Akmal, Dhimas) lewat PR + komunikasi eksplisit, lalu bump `schema_version`.

1. **Model hanya menghasilkan `code`, `quote`, `reason`, dan `box_2d`.** Field `label`, `severity`, `legal_basis` diisi `analyzer.py` dari `catalog.py` — bukan dari model. Kode yang tidak ada di katalog **dibuang** dan dicatat di log.
2. **`needs_manual_check` dihitung kode**, bukan model. Kondisi yang memicu `true`:
   - `confidence < 0.6`
   - `fingerprint.raw_text` hasil OCR terlalu pendek (< 30 karakter)
3. **Urutan pipeline untuk tiap gambar (TIDAK boleh terbalik):**
   ```
   [Gambar masuk] → pHash dihitung dari ORIGINAL → [PII Blur] → [Kirim ke Gemini]
   ```

   - `image_phash` di `Fingerprint` berasal dari **gambar asli** (sebelum blur).
   - `raw_text` dan `normalized_text` berasal dari gambar **post-blur**.
   - Blur tidak boleh mengubah dimensi gambar (koordinat bbox akan meleset).
4. **`disclaimer` tidak ada di model ini.** Teks legal disimpan sebagai konstanta berversi di frontend dan backend — bukan di-generate AI.
5. **`recommendations` tidak ada di model ini.** Dibuat backend dari template berdasarkan `risk_level`, hasil `official_check`, dan tautan resmi.
6. **Transformasi Koordinat Bounding Box:**
   - Model mentah Gemini menghasilkan `box_2d: [ymin, xmin, ymax, xmax]` berskala integer `0–1000`.
   - Skema kontrak API [`services/ai/schema.py`](services/ai/schema.py) menormalisasinya menjadi `BBox(x, y, w, h)` bertipe float `0.0–1.0`.
   - Frontend UI (`prototypes/result.html`) merender kotak penanda di atas poster gambar memakai persentase CSS `0–100%`:
     `top: ${bbox.y * 100}%; left: ${bbox.x * 100}%; width: ${bbox.w * 100}%; height: ${bbox.h * 100}%;`

### Pipeline TypeScript (wajib dijalankan setelah ubah schema)

```bash
# 1. Jalankan FastAPI untuk generate OpenAPI
uvicorn main:app --port 8000 &

# 2. Generate TypeScript types dari OpenAPI
npx openapi-typescript http://localhost:8000/openapi.json -o apps/web/src/types/api.ts
```

Jangan tulis tipe TypeScript untuk kontrak ini secara manual — selalu generate dari Pydantic.

---

## 6. Design System Rules

Semua halaman UI mengacu pada `prototypes/DESAIN.md`. Aturan wajib saat membuat atau memodifikasi halaman HTML:

1. **Salin `<head>` dari halaman acuan standar terbaru** (gunakan `index.html` atau `cekloker.html`). Dua blok harus selalu identik di semua halaman:
   - `<style id="ck-design-system">` — token warna dan kelas komponen
   - `<script id="ck-tailwind-config">` — konfigurasi Tailwind

2. **Jangan tulis kode hex baru** di luar blok `ck-design-system`. Gunakan CSS variable `--ck-*` yang sudah ada.

3. **Jika perlu token/komponen baru:** tambahkan ke blok `ck-design-system` di **semua** halaman sekaligus, lalu dokumentasikan di `DESAIN.md`.

4. **Status harus selalu: warna + ikon + teks.** Gunakan `.badge-aman`, `.badge-waspada`, `.badge-bahaya` — jangan tampilkan status hanya lewat warna.

5. **Merah hanya untuk red flag dan error form.** Bukan untuk dekorasi atau penekanan biasa.

6. **Aksesibilitas tidak boleh turun** — setiap `<input>` harus punya `<label>`, kontras WCAG AA, dan dukungan `prefers-reduced-motion`.

7. **Halaman acuan implementasi (prototypes):**
   - Registrasi: gunakan `daftar-akun.html` sebagai acuan utama (bukan `register.html` yang bersifat legacy).
   - Halaman hasil: gabungkan struktur pelaporan komprehensif dari `hasil-pemeriksaan.html` dan visualisasi interaktif bounding box dari `result.html`.

8. **Alur Aksi Interaktif Halaman Hasil:**
   - **Koreksi Hasil AI (FR-LPR-03):** Sediakan modal formulir sanggahan agar pengguna dapat mengoreksi temuan red flag yang dirasa keliru.
   - **Laporkan Loker (FR-LPR-01):** Tombol aksi pelaporan mengarahkan ke `laporkan-loker-ini.html` dengan membawa query param ID atau data lowongan yang telah diperiksa.
   - **Ekspor Dokumen PDF (FR-HSL-02):** Sediakan tombol cetak dokumen yang memanfaatkan CSS `@media print` dan kelas `.no-print` untuk mengunduh/mencetak dokumen evaluasi.

---

## 7. General Agent Behavior

- **Atomic Commits:** Prefer small, single-purpose commits over giant multi-feature commits.
- **Explain Intent:** When generating commit messages or making changes, focus on the _why_ and the _impact_.
- **Preserve Existing Structure:** Do not rearrange existing files or directories without explicit user instruction.

## 8. Boundaries

- Never commit `.env`, API keys, or real user screenshots.
- Do not edit `docs/` unless requested.

## 9. Language

- Code, comments, commits: English. UI copy: Indonesian.
