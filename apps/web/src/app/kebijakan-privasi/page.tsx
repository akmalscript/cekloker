import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Kebijakan Privasi — CekLoker",
  description:
    "Kebijakan Privasi CekLoker: data apa yang kami simpan, bagaimana data dipakai, berapa lama disimpan, dan hak Anda atas data pribadi.",
};

export default function KebijakanPrivasiPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main id="konten" className="flex-1">
        <article
          className="mx-auto w-full max-w-[768px] px-6 pb-14 pt-8 md:pt-16"
          aria-labelledby="judul"
        >
          <header>
            <h1 id="judul" className="text-[30px] font-bold text-ink md:text-[40px]">
              Kebijakan Privasi
            </h1>
            <p className="mt-3 text-sm text-muted md:mt-4">
              Terakhir diperbarui: <time dateTime="2026-11-05">5 November 2026</time>
            </p>
            <p className="mt-6 text-ink">
              CekLoker hanya menyimpan data yang Anda berikan untuk pemeriksaan dan riwayat.
            </p>
          </header>

          {/* Daftar isi */}
          <nav className="card mt-6 p-6" aria-labelledby="toc-title">
            <h2 id="toc-title" className="text-base font-semibold leading-6 tracking-normal text-ink">
              Daftar isi
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-medium leading-5 text-navy">
              <li>
                <a href="#data-dikumpulkan" className="rounded underline-offset-4 hover:underline">
                  1. Data yang kami kumpulkan
                </a>
              </li>
              <li>
                <a href="#penggunaan-data" className="rounded underline-offset-4 hover:underline">
                  2. Cara kami memakai data
                </a>
              </li>
              <li>
                <a href="#penyimpanan" className="rounded underline-offset-4 hover:underline">
                  3. Penyimpanan &amp; penghapusan
                </a>
              </li>
              <li>
                <a href="#hak-anda" className="rounded underline-offset-4 hover:underline">
                  4. Hak Anda
                </a>
              </li>
              <li>
                <a href="#kontak" className="rounded underline-offset-4 hover:underline">
                  5. Kontak
                </a>
              </li>
            </ul>
          </nav>

          {/* Isi kebijakan */}
          <div className="mt-6 space-y-6">
            <section id="data-dikumpulkan" className="scroll-mt-28" aria-labelledby="data-dikumpulkan-title">
              <h2 id="data-dikumpulkan-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                1. Data yang kami kumpulkan
              </h2>
              <p className="text-muted leading-relaxed">
                Kami menyimpan data yang Anda berikan saat menggunakan CekLoker, seperti informasi akun (nama, email), detail berkas poster lowongan atau tangkapan layar percakapan rekruter yang diunggah, serta hasil pemeriksaan dalam riwayat Anda. Sistem kami secara otomatis menyensor data sensitif pribadi (seperti NIK, foto KTP, nomor rekening, atau alamat lengkap) sebelum diproses ke mesin analisis AI. Berikan hanya informasi yang diperlukan dan hindari mengirim data sensitif yang tidak terkait dengan pemeriksaan.
              </p>
            </section>

            <section id="penggunaan-data" className="scroll-mt-28" aria-labelledby="penggunaan-data-title">
              <h2 id="penggunaan-data-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                2. Cara kami memakai data
              </h2>
              <p className="text-muted leading-relaxed">
                Data Anda digunakan untuk memproses pemeriksaan lowongan, mendeteksi pola tanda bahaya (red flags), menampilkan hasil, dan menyediakan riwayat agar dapat Anda lihat kembali. Kami tidak menjual data pribadi Anda atau menggunakannya untuk tujuan yang tidak berkaitan dengan layanan CekLoker.
              </p>
            </section>

            <section id="penyimpanan" className="scroll-mt-28" aria-labelledby="penyimpanan-title">
              <h2 id="penyimpanan-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                3. Penyimpanan &amp; penghapusan
              </h2>
              <div className="space-y-3 text-muted leading-relaxed">
                <p>
                  Data disimpan selama diperlukan untuk menyediakan pemeriksaan dan riwayat Anda. Untuk pengguna tamu (tanpa akun), data pemeriksaan tersimpan sementara selama 24 jam lalu otomatis kedaluwarsa.
                </p>
                <p>
                  Untuk pengguna terdaftar, riwayat tersimpan aman hingga Anda menghapusnya secara mandiri. Dari cadangan, data terhapus paling lambat 30 hari setelah Anda menghapus.
                </p>
              </div>
            </section>

            <section id="hak-anda" className="scroll-mt-28" aria-labelledby="hak-anda-title">
              <h2 id="hak-anda-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                4. Hak Anda
              </h2>
              <p className="text-muted leading-relaxed">
                Anda berhak mengakses, memperbaiki, atau meminta penghapusan data pribadi yang Anda berikan. Untuk mengajukan permintaan, hubungi kami dan jelaskan data yang ingin Anda akses, perbaiki, atau hapus. Kami akan membantu menindaklanjuti permintaan Anda.
              </p>
            </section>

            <section id="kontak" className="scroll-mt-28" aria-labelledby="kontak-title">
              <h2 id="kontak-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                5. Kontak
              </h2>
              <p className="text-muted leading-relaxed">
                Jika Anda memiliki pertanyaan tentang kebijakan ini atau penggunaan data pribadi Anda, silakan hubungi tim CekLoker melalui halaman Hubungi kami. Sertakan keterangan yang relevan tanpa mengirim kata sandi atau informasi sensitif.
              </p>
            </section>
          </div>

          {/* Kotak kontak */}
          <aside className="mt-6 rounded-card bg-navy-tint p-6" aria-labelledby="bantuan-title">
            <p id="bantuan-title" className="text-lg font-semibold leading-7 text-navy">
              Pertanyaan soal privasi?
            </p>
            <Link
              href="/database-loker"
              className="mt-3 inline-block rounded font-medium text-navy underline underline-offset-4 hover:text-navy-hover"
            >
              Hubungi kami
            </Link>
          </aside>
        </article>
      </main>

      <Footer />
    </div>
  );
}

