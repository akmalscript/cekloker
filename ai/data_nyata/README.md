# Data uji nyata CekLoker

Gambar TIDAK di-commit (hak cipta pihak lain + data pribadi). Yang di-commit: labels.csv dan sumber.csv.

## Cara menambah satu sampel
1. Simpan tangkapan layar ke folder ini, nama bebas tanpa spasi: `jebakan_taspen.png`, `asli_karirhub_01.png`.
2. Bersihkan: stempel HOAX, komentar pembocor jawaban, nama/foto/nomor orang yang bukan perekrut.
3. Isi SATU baris di labels.csv SEBELUM menjalankan AI.
4. Isi SATU baris di sumber.csv.
5. Jalankan:  python cek_data.py   lalu   python eval.py data_nyata

## labels.csv
- label: `jebakan` atau `asli`
- red_flag_yang_diharapkan: kode dipisah titik koma, kosong bila tidak ada. Hanya dari yang TERTULIS di gambar.
- jenis: `biasa`, `sulit`, atau `tanpa_petunjuk_visual` (jebakan ada di tautan/kontak, bukan di gambar)
- catatan: bebas

Contoh baris:
    jebakan_taspen.png,jebakan,biaya_di_muka;kontak_tidak_resmi,sulit,potongan dari video klarifikasi
    asli_karirhub_01.png,asli,,biasa,screenshot Karirhub

## sumber.csv
- url: halaman yang MEMBUKTIKAN label (klarifikasi hoaks / portal resmi)
- asal_label: contoh `klarifikasi KPPN`, `portal Karirhub`, `laporan teman (izin)`
- tanggal_ambil: YYYY-MM-DD
- kelompok: sama untuk versi lain dari postingan yang sama (agar tidak dihitung dua kali)
- disamarkan: `ya` bila nama/nomor pribadi sudah ditutup, `tidak` bila tidak ada data pribadi
