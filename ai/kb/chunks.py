"""Basis pengetahuan CekLoker (sumber RAG).

ATURAN:
- Potongan yang isinya masih memuat "[ISI" TIDAK dipakai (diabaikan oleh pencarian)
  sampai kamu menggantinya dengan isi yang sudah dicek ke sumber resmi.
- Jangan menulis nomor pasal dari ingatan. Salin dari teks UU resmi, lalu isi `sumber`.
- Setiap potongan bertanda verifikasi=True WAJIB kamu cek sebelum masuk proposal.
- jenis: modus = ciri penipuan; wajar = praktik sah (untuk mencegah alarm palsu);
         hukum = dasar hukum; tindakan = apa yang harus dilakukan pengguna.
"""

KB = [
    dict(id="modus_visa_turis", jenis="modus", judul="Berangkat kerja dengan visa turis/kunjungan",
         isi="Penempatan kerja ke luar negeri memakai visa turis atau visa kunjungan, bukan visa kerja. Pekerja tidak punya izin kerja dan perlindungan hukum di negara tujuan, sehingga berisiko ditahan petugas imigrasi atau dieksploitasi.",
         kata_kunci=["visa turis", "visa kunjungan", "tourist", "visa"], sumber=None, verifikasi=True),
    dict(id="modus_paspor_ditahan", jenis="modus", judul="Penahanan paspor atau dokumen asli",
         isi="Perekrut atau majikan yang menahan paspor, ijazah, atau dokumen asli lain adalah indikator kerja paksa dan jerat utang. Pencari kerja kehilangan kebebasan untuk pulang atau berpindah.",
         kata_kunci=["paspor", "ditahan", "disimpan", "ijazah", "dokumen asli", "kami pegang"], sumber=None, verifikasi=True),
    dict(id="modus_scam_asia_tenggara", jenis="modus", judul="Lowongan admin online di Kamboja, Myanmar, Laos",
         isi="Tawaran kerja admin online, customer service, atau operator di Kamboja, Myanmar, Laos, atau Filipina dengan gaji tinggi tanpa syarat berarti. Pola ini sering berujung pada penyekapan dan pemaksaan melakukan penipuan online.",
         kata_kunci=["kamboja", "myanmar", "laos", "filipina", "admin online", "customer service", "gaji tinggi", "tanpa pengalaman", "phnom penh"], sumber=None, verifikasi=True),
    dict(id="modus_tugas_deposit", jenis="modus", judul="Kerja tugas like/subscribe lalu diminta deposit",
         isi="Pekerjaan paruh waktu seperti like, subscribe, atau memberi rating dengan bayaran per tugas, lalu pencari kerja diminta deposit untuk naik level dengan janji uang kembali plus komisi. Ini pola penipuan tugas (task scam): uang deposit tidak kembali.",
         kata_kunci=["tugas", "like", "subscribe", "deposit", "komisi", "level", "part time", "per tugas", "rating"], sumber=None, verifikasi=True),
    dict(id="modus_biaya_utang", jenis="modus", judul="Biaya di muka dan jerat utang keberangkatan",
         isi="Diminta membayar biaya pendaftaran, administrasi, pelatihan, atau tiket sebelum bekerja, atau biaya 'ditalangi dulu' lalu dipotong dari gaji berbulan-bulan. Skema ini membuat pekerja berutang kepada perekrut dan sulit keluar. Perekrut yang sah menjelaskan biaya secara tertulis sebelum perjanjian ditandatangani.",
         kata_kunci=["biaya", "administrasi", "pendaftaran", "transfer", "talangi", "potong gaji", "dipotong", "utang", "deposit", "tiket"], sumber=None, verifikasi=True),
    dict(id="modus_telegram_apk", jenis="modus", judul="Ajakan pindah ke Telegram dan kiriman file APK",
         isi="Perekrut mengajak pindah ke Telegram atau WhatsApp pribadi, lalu mengirim file APK atau tautan asing untuk 'formulir' atau 'aplikasi kerja'. File semacam ini bisa mencuri data dan mengambil alih perangkat.",
         kata_kunci=["apk", "telegram", "link", "tautan", "install", "aplikasi", "file", "grup"], sumber=None, verifikasi=True),
    dict(id="modus_kerahasiaan", jenis="modus", judul="Diminta merahasiakan dari keluarga",
         isi="Pencari kerja diminta merahasiakan tawaran dari keluarga atau pihak lain, atau dilarang bertanya ke instansi resmi. Isolasi ini menghalangi korban mendapat bantuan atau mengecek kebenaran tawaran.",
         kata_kunci=["rahasia", "jangan bilang", "jangan beri tahu", "keluarga", "diam-diam"], sumber=None, verifikasi=True),
    dict(id="modus_data_pribadi", jenis="modus", judul="Data pribadi diminta terlalu dini",
         isi="Diminta foto KTP, paspor, selfie memegang KTP, nomor rekening, atau kode OTP sebelum ada wawancara resmi dan kontrak. Data ini dapat disalahgunakan untuk pinjaman online atau pembobolan rekening.",
         kata_kunci=["ktp", "selfie", "otp", "rekening", "data pribadi", "foto paspor", "kirim foto"], sumber=None, verifikasi=True),
    dict(id="modus_tiket_tanpa_kontrak", jenis="modus", judul="Berangkat tanpa perjanjian kerja tertulis",
         isi="Dijanjikan tiket dan keberangkatan, sementara kontrak 'dikirim setelah tiba' atau hanya disebut 'standar'. Tanpa perjanjian kerja tertulis sebelum berangkat, pekerja tidak punya pegangan hukum atas gaji, jam kerja, dan hak lainnya.",
         kata_kunci=["kontrak", "setelah tiba", "tiket", "perjanjian kerja", "berangkat"], sumber=None, verifikasi=True),
    dict(id="modus_desakan", jenis="modus", judul="Desakan waktu agar tidak sempat mengecek",
         isi="Tekanan waktu seperti 'harus berangkat bulan ini', 'kuota tinggal sedikit', atau 'konfirmasi hari ini' dipakai agar korban tidak sempat membaca kontrak atau mengecek legalitas perekrut.",
         kata_kunci=["segera", "hari ini", "kuota", "terbatas", "buruan", "bulan ini", "besok", "siap berangkat"], sumber=None, verifikasi=True),
    dict(id="modus_gaji_tidak_wajar", jenis="modus", judul="Gaji jauh di atas kewajaran",
         isi="Gaji sangat tinggi untuk pekerjaan ringan atau tanpa kualifikasi, misalnya jutaan rupiah per hari untuk tugas daring sederhana. Iming-iming ini umum dipakai untuk menurunkan kewaspadaan.",
         kata_kunci=["gaji", "juta", "per hari", "sehari", "tanpa pengalaman", "mudah", "bonus"], sumber=None, verifikasi=True),
    dict(id="modus_kontak_tidak_resmi", jenis="modus", judul="Kontak perekrut tidak resmi",
         isi="Perekrut memakai nomor WhatsApp pribadi, email gratis, atau akun media sosial tanpa alamat kantor dan nama perusahaan yang bisa diverifikasi. Perusahaan sah biasanya memakai domain email resmi dan alamat kantor yang jelas.",
         kata_kunci=["whatsapp", "wa", "nomor pribadi", "gmail", "akun", "kantor", "dm"], sumber=None, verifikasi=True),

    # --- Praktik wajar: mencegah alarm palsu ---
    dict(id="wajar_tenggat_hr", jenis="wajar", judul="Tenggat konfirmasi dari HR yang sah",
         isi="HR yang sah boleh menetapkan batas waktu konfirmasi offering letter, termasuk alasan kuota onboarding. Itu wajar selama kandidat diberi kesempatan membaca dokumen dan bertanya sebelum memutuskan.",
         kata_kunci=["offering letter", "konfirmasi", "batas waktu", "hr", "onboarding", "kuota"], sumber=None, verifikasi=True),
    dict(id="wajar_dokumen_payroll", jenis="wajar", judul="Dokumen untuk BPJS dan payroll setelah offering letter",
         isi="Perusahaan sah dapat meminta fotokopi KTP, NPWP, dan nomor rekening setelah offering letter ditandatangani, untuk keperluan BPJS dan payroll. Permintaan data pada tahap ini, dengan tujuan jelas, berbeda dengan permintaan data sebelum ada wawancara dan kontrak.",
         kata_kunci=["ktp", "npwp", "rekening", "bpjs", "payroll", "offering letter"], sumber=None, verifikasi=True),
    dict(id="wajar_p3mi", jenis="wajar", judul="Ciri penempatan resmi oleh P3MI",
         isi="Perusahaan penempatan resmi menjelaskan biaya secara tertulis sebelum perjanjian ditandatangani, tidak menahan paspor atau ijazah asli, mengundang wawancara tatap muka di kantor yang terdaftar, dan mempersilakan calon pekerja mengecek legalitasnya di portal resmi pemerintah. Kalimat yang membantah praktik berbahaya, seperti 'tidak ada utang di muka', bukan red flag.",
         kata_kunci=["p3mi", "biaya penempatan", "tatap muka", "portal resmi", "legalitas", "tidak ada utang", "tidak menahan paspor"], sumber=None, verifikasi=True),

    # --- Hukum & tindakan: ISI DULU dari sumber resmi, baru aktif ---
    dict(id="hukum_ppmi", jenis="hukum", judul="UU No. 18 Tahun 2017 tentang Pelindungan Pekerja Migran Indonesia",
         isi="[ISI: salin dari teks UU resmi, tanpa mengarang. Yang dibutuhkan: pihak yang berwenang menempatkan PMI, ketentuan biaya penempatan, larangan menahan dokumen. Tulis nomor pasal HANYA bila sudah dicek, dan isi `sumber` dengan tautan.]",
         kata_kunci=["pekerja migran", "penempatan", "p3mi", "biaya", "dokumen", "luar negeri"], sumber=None, verifikasi=True),
    dict(id="hukum_tppo", jenis="hukum", judul="UU No. 21 Tahun 2007 tentang Pemberantasan Tindak Pidana Perdagangan Orang",
         isi="[ISI: salin dari teks UU resmi. Yang dibutuhkan: definisi TPPO dan unsur proses, cara, dan tujuan eksploitasi. Nomor pasal hanya bila sudah dicek; isi `sumber`.]",
         kata_kunci=["perdagangan orang", "tppo", "eksploitasi", "jerat utang", "penipuan", "iming-iming"], sumber=None, verifikasi=True),
    dict(id="tindakan_lapor", jenis="tindakan", judul="Apa yang dilakukan bila curiga",
         isi="[ISI: langkah praktis dan kontak resmi TERBARU dari situs pemerintah (instansi pelindungan pekerja migran, Kemnaker, kepolisian, perwakilan RI di luar negeri). Nama dan kontak instansi sempat berubah, jadi cek yang terbaru. Jangan memakai nomor dari ingatan.]",
         kata_kunci=["lapor", "korban", "bantuan", "hubungi", "polisi", "kbri"], sumber=None, verifikasi=True),
]
