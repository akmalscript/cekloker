"""Sumber tunggal daftar red flag CekLoker.

Dipakai oleh: prompt (definisi untuk model), skor risiko (bobot), dan nanti RAG
(basis pengetahuan). Ubah di sini, jangan di tempat lain.

CATATAN:
- weight adalah tebakan awal. Tuning setelah uji 40+ contoh berlabel.
- legal hanya menyebut nama undang-undang. Nomor pasal SENGAJA dikosongkan:
  isi sendiri setelah dicek ke teks resmi (jangan percaya pasal dari AI).
- "tidak ditemukan di jalur resmi" (red flag ke-15) TIDAK ada di sini karena
  berasal dari pencocokan data resmi (kode), bukan dari pembacaan gambar.
"""
from enum import Enum

UU_PPMI = "UU No. 18 Tahun 2017 tentang Pelindungan Pekerja Migran Indonesia"
UU_TPPO = "UU No. 21 Tahun 2007 tentang Pemberantasan Tindak Pidana Perdagangan Orang"

RED_FLAGS = {
    "gaji_tidak_wajar": dict(
        label="Gaji tidak wajar",
        definition="Gaji jauh di atas pasaran untuk posisi dan syarat yang ringan (tanpa pengalaman, tanpa ijazah), atau dijanjikan dalam mata uang asing dengan nominal tidak masuk akal.",
        weight=2, legal=UU_PPMI),
    "visa_turis": dict(
        label="Berangkat dengan visa turis",
        definition="Calon pekerja diminta atau disarankan berangkat memakai visa turis/kunjungan untuk bekerja.",
        weight=4, legal=UU_PPMI),
    "paspor_ditahan": dict(
        label="Penahanan dokumen",
        definition="Paspor, ijazah asli, KTP, atau dokumen identitas lain diminta dititipkan/ditahan oleh perekrut atau perusahaan.",
        weight=4, legal=UU_TPPO),
    "biaya_di_muka": dict(
        label="Biaya di muka",
        definition="Diminta membayar biaya pendaftaran, administrasi, pelatihan, tiket, atau utang keberangkatan sebelum bekerja. Termasuk biaya yang 'ditalangi dulu' lalu dipotong dari gaji, atau deposit yang dijanjikan kembali.",
        weight=3, legal=UU_PPMI),
    "negara_rawan": dict(
        label="Negara tujuan rawan penipuan",
        definition="Negara tujuan yang dikenal sebagai pusat online scam/TPPO (misalnya Kamboja, Myanmar, Laos, Filipina utara) untuk posisi seperti customer service atau operator online.",
        weight=3, legal=UU_TPPO),
    "desakan_berangkat": dict(
        label="Desakan berangkat cepat",
        definition="Tekanan waktu yang menghalangi korban berpikir, membaca kontrak, atau mengecek legalitas: harus segera berangkat, setor, atau memutuskan dalam hitungan hari. Tenggat konfirmasi wajar dari HR yang tetap memberi kesempatan membaca dokumen BUKAN red flag.",
        weight=2, legal=UU_PPMI),
    "wawancara_hanya_chat": dict(
        label="Wawancara hanya lewat chat",
        definition="Seluruh proses seleksi hanya lewat chat/pesan, tanpa wawancara langsung atau video dan tanpa kontrak yang jelas.",
        weight=1, legal=UU_PPMI),
    "ajakan_telegram": dict(
        label="Ajakan pindah ke kanal lain",
        definition="Diajak pindah ke Telegram, WhatsApp pribadi, atau kanal lain di luar platform lowongan.",
        weight=2, legal=UU_PPMI),
    "minta_dirahasiakan": dict(
        label="Diminta merahasiakan",
        definition="Diminta tidak memberi tahu keluarga atau pihak lain tentang pekerjaan atau keberangkatan.",
        weight=3, legal=UU_TPPO),
    "kirim_apk": dict(
        label="Kiriman file APK/tautan mencurigakan",
        definition="Perekrut mengirim file APK atau tautan untuk diinstal/diunduh.",
        weight=3, legal=None),
    "data_pribadi_berlebihan": dict(
        label="Permintaan data pribadi berlebihan",
        definition="Diminta NIK, foto KTP/KK/paspor, data rekening, atau kode OTP yang tidak relevan pada tahap lamaran.",
        weight=2, legal=None),
    "perusahaan_mencurigakan": dict(
        label="Identitas perusahaan mencurigakan",
        definition="Nama perusahaan tidak jelas, alamat tidak ada atau tidak lengkap, tidak ada situs atau legalitas yang bisa dicek.",
        weight=2, legal=UU_PPMI),
    "kontak_tidak_resmi": dict(
        label="Kontak tidak resmi",
        definition="Hanya mencantumkan nomor pribadi atau email gratisan, tanpa kontak perusahaan.",
        weight=1, legal=None),
    "tiket_tanpa_kontrak": dict(
        label="Tiket/keberangkatan tanpa kontrak",
        definition="Dijanjikan tiket dan keberangkatan tanpa perjanjian kerja tertulis yang jelas.",
        weight=3, legal=UU_PPMI),
}

# Tingkat Bahaya langsung bila salah satu ini terdeteksi (tuning nanti).
CRITICAL = {"visa_turis", "paspor_ditahan"}

RedFlagCode = Enum("RedFlagCode", {k: k for k in RED_FLAGS}, type=str)
