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
          className="mx-auto w-full max-w-[768px] px-6 pb-16 pt-8 md:pt-16"
          aria-labelledby="judul"
        >
          <header>
            <h1 id="judul" className="text-[30px] font-extrabold text-ink md:text-[40px]">
              Kebijakan Privasi
            </h1>
            <p className="mt-3 text-sm text-muted md:mt-4">
              Terakhir diperbarui: <time dateTime="2026-11-05">5 November 2026</time>
            </p>
            <p className="mt-6 text-base text-ink leading-relaxed">
              CekLoker berkomitmen melindungi privasi pencari kerja. Kami hanya menyimpan dan memproses data yang diperlukan untuk mendeteksi indikasi risiko lowongan serta menyediakan riwayat pemeriksaan Anda.
            </p>
          </header>

          {/* Daftar Isi */}
          <nav className="card mt-6 p-6 bg-white" aria-labelledby="toc-title">
            <h2 id="toc-title" className="text-base font-semibold leading-6 tracking-normal text-ink">
              Daftar isi
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-medium leading-5 text-navy">
              <li>
                <a href="#data-dikumpulkan" className="rounded hover:underline underline-offset-4">
                  1. Data yang kami kumpulkan
                </a>
              </li>
              <li>
                <a href="#penggunaan-data" className="rounded hover:underline underline-offset-4">
                  2. Cara kami memakai data
                </a>
              </li>
              <li>
                <a href="#penyimpanan" className="rounded hover:underline underline-offset-4">
                  3. Penyimpanan &amp; penghapusan data
                </a>
              </li>
              <li>
                <a href="#hak-anda" className="rounded hover:underline underline-offset-4">
                  4. Hak Anda atas data pribadi
                </a>
              </li>
              <li>
                <a href="#kontak" className="rounded hover:underline underline-offset-4">
                  5. Kontak &amp; layanan bantuan
                </a>
              </li>
            </ul>
          </nav>

          {/* Isi Kebijakan */}
          <div className="mt-8 space-y-8">
            <section id="data-dikumpulkan" className="scroll-mt-28" aria-labelledby="data-dikumpulkan-title">
              <h2 id="data-dikumpulkan-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                1. Data yang kami kumpulkan
              </h2>
              <p className="text-muted leading-relaxed">
                Kami menyimpan data yang Anda berikan saat menggunakan CekLoker, seperti informasi akun (nama, email), detail berkas poster lowongan atau tangkapan layar percakapan rekruter yang diunggah, serta hasil analisis risiko AI. Sistem kami secara otomatis melakukan pengaburan (*PII blurring*) pada data sensitif pribadi (seperti NIK, nomor rekening, atau alamat lengkap) sebelum diproses ke mesin analisis kecerdasan buatan.
              </p>
            </section>

            <section id="penggunaan-data" className="scroll-mt-28" aria-labelledby="penggunaan-data-title">
              <h2 id="penggunaan-data-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                2. Cara kami memakai data
              </h2>
              <p className="text-muted leading-relaxed">
                Data Anda digunakan secara eksklusif untuk mendeteksi pola tanda bahaya (*red flags*), mengkroscek nama perusahaan ke pangkalan data resmi ketenagakerjaan (P3MI / BP2MI / Kemnaker), dan menyajikan laporan bukti indikasi risiko. Kami tidak menjual data pribadi Anda atau menyebarkannya kepada pihak ketiga tanpa persetujuan Anda.
              </p>
            </section>

            <section id="penyimpanan" className="scroll-mt-28" aria-labelledby="penyimpanan-title">
              <h2 id="penyimpanan-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                3. Penyimpanan &amp; penghapusan data
              </h2>
              <div className="space-y-3 text-muted leading-relaxed">
                <p>
                  <strong>Mode Pengguna Tamu (Tanpa Akun):</strong> Hasil pemeriksaan disimpan sementara di server selama <strong>24 jam</strong> terikat pada cookie sesi tamu unik. Setelah 24 jam, catatan hasil pemeriksaan dibersihkan secara otomatis (*privacy compliance*).
                </p>
                <p>
                  <strong>Pengguna Terdaftar:</strong> Riwayat pemeriksaan disimpan secara aman di akun Anda agar dapat diakses kapan pun. Anda memiliki hak penuh untuk menghapus sebagian atau seluruh riwayat kapan saja melalui halaman Riwayat.
                </p>
              </div>
            </section>

            <section id="hak-anda" className="scroll-mt-28" aria-labelledby="hak-anda-title">
              <h2 id="hak-anda-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                4. Hak Anda atas data pribadi (FR-PRI-02)
              </h2>
              <p className="text-muted leading-relaxed">
                Sesuai prinsip pelindungan data pribadi (UU PDP RI), Anda berhak mengakses, memperbaiki, mengunduh salinan, atau menghapus seluruh catatan pemeriksaan akun Anda secara mandiri. Bila Anda menghapus riwayat pemeriksaan, data akan langsung dimusnahkan secara permanen dari basis data operasional.
              </p>
            </section>

            <section id="kontak" className="scroll-mt-28" aria-labelledby="kontak-title">
              <h2 id="kontak-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                5. Kontak &amp; layanan bantuan
              </h2>
              <p className="text-muted leading-relaxed">
                Jika Anda memiliki pertanyaan tentang kebijakan privasi ini atau ingin mengajukan permohonan terkait data pribadi Anda, silakan hubungi tim CekLoker melalui kanal bantuan resmi atau email pengaduan tim kami.
              </p>
            </section>
          </div>

          {/* Kotak Bantuan */}
          <aside className="mt-8 rounded-card bg-navy-tint p-6" aria-labelledby="bantuan-title">
            <p id="bantuan-title" className="text-lg font-semibold leading-7 text-navy">
              Pertanyaan seputar privasi &amp; data?
            </p>
            <p className="mt-1 text-sm text-muted">
              Tim kami siap membantu menjawab pertanyaan Anda terkait pengelolaan data dan keamanan.
            </p>
            <Link
              href="/database-loker"
              className="mt-4 inline-block font-bold text-navy hover:underline underline-offset-4"
            >
              Jelajahi Database Loker Terverifikasi →
            </Link>
          </aside>
        </article>
      </main>

      <Footer />
    </div>
  );
}

