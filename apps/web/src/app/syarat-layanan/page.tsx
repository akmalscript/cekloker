import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Syarat Layanan — CekLoker",
  description:
    "Syarat & Ketentuan Layanan CekLoker: batasan teknologi AI, indikasi risiko, pelaporan masyarakat, dan tanggung jawab hukum.",
};

export default function SyaratLayananPage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main id="konten" className="flex-1">
        <article
          className="mx-auto w-full max-w-[768px] px-6 pb-8 pt-8 md:pb-12 md:pt-14"
          aria-labelledby="judul"
        >
          <header>
            <h1 id="judul" className="text-[30px] font-bold text-ink md:text-[40px]">
              Syarat Layanan
            </h1>
            <p className="mt-3 text-sm text-muted md:mt-4">
              Terakhir diperbarui: <time dateTime="2026-11-05">5 November 2026</time>
            </p>
            <p className="mt-6 leading-6 text-ink">
              Dengan memakai CekLoker, Anda setuju dengan syarat ini.
            </p>
          </header>

          {/* Daftar isi */}
          <nav className="card mt-6 p-6" aria-labelledby="toc-title">
            <h2 id="toc-title" className="text-base font-semibold leading-6 tracking-normal text-ink">
              Daftar isi
            </h2>
            <ul className="mt-2.5 space-y-3 text-sm font-medium leading-5 text-navy">
              <li>
                <a href="#layanan-kami" className="rounded underline underline-offset-2 hover:text-navy-hover">
                  1. Layanan kami
                </a>
              </li>
              <li>
                <a href="#indikasi-risiko" className="rounded underline underline-offset-2 hover:text-navy-hover">
                  2. Hasil pemeriksaan adalah indikasi risiko
                </a>
              </li>
              <li>
                <a href="#laporan-pengguna" className="rounded underline underline-offset-2 hover:text-navy-hover">
                  3. Laporan pengguna
                </a>
              </li>
              <li>
                <a href="#batasan-tanggung-jawab" className="rounded underline underline-offset-2 hover:text-navy-hover">
                  4. Batasan tanggung jawab
                </a>
              </li>
              <li>
                <a href="#perubahan-syarat" className="rounded underline underline-offset-2 hover:text-navy-hover">
                  5. Perubahan syarat
                </a>
              </li>
            </ul>
          </nav>

          {/* Isi syarat */}
          <div className="mt-6 space-y-6 md:mt-7">
            <section id="layanan-kami" className="scroll-mt-28" aria-labelledby="layanan-kami-title">
              <h2 id="layanan-kami-title" className="mb-2.5 text-lg font-bold leading-snug text-ink md:text-xl">
                1. Layanan kami
              </h2>
              <p className="leading-6 text-muted">
                CekLoker membantu Anda memeriksa indikasi risiko pada lowongan kerja dan menerima laporan pengguna. Layanan ini menjadi bahan pertimbangan sebelum Anda melamar atau memberikan data pribadi.
              </p>
            </section>

            <section id="indikasi-risiko" className="scroll-mt-28" aria-labelledby="indikasi-risiko-title">
              <h2 id="indikasi-risiko-title" className="mb-2.5 text-lg font-bold leading-snug text-ink md:text-xl">
                2. Hasil pemeriksaan adalah indikasi risiko
              </h2>
              <div className="space-y-3 leading-6 text-muted">
                <p>
                  Hasil analisis AI adalah indikasi risiko awal (*preliminary risk assessment*), bukan keputusan hukum resmi. CekLoker tidak menyatakan sebuah lowongan pasti penipuan atau pasti aman.
                </p>
                <p>
                  Status &quot;tidak ditemukan&quot; pada basis data resmi bukan bukti bahwa perusahaan otomatis ilegal, melainkan menunjukkan ketiadaan jaminan pelindungan hukum ketenagakerjaan resmi dari negara RI.
                </p>
              </div>
            </section>

            <section id="laporan-pengguna" className="scroll-mt-28" aria-labelledby="laporan-pengguna-title">
              <h2 id="laporan-pengguna-title" className="mb-2.5 text-lg font-bold leading-snug text-ink md:text-xl">
                3. Laporan pengguna
              </h2>
              <p className="leading-6 text-muted">
                Kirimkan laporan dengan informasi yang benar dan bukti yang relevan. Jangan mengirim laporan palsu, konten melanggar hukum, atau data pribadi orang lain tanpa izin. Laporan dapat ditinjau sebelum ditampilkan.
              </p>
            </section>

            <section id="batasan-tanggung-jawab" className="scroll-mt-28" aria-labelledby="batasan-tanggung-jawab-title">
              <h2 id="batasan-tanggung-jawab-title" className="mb-2.5 text-lg font-bold leading-snug text-ink md:text-xl">
                4. Batasan tanggung jawab
              </h2>
              <p className="leading-6 text-muted">
                CekLoker tidak menjamin kelengkapan atau keakuratan setiap informasi lowongan. Keputusan melamar dan berinteraksi dengan perekrut tetap menjadi tanggung jawab Anda. Verifikasi informasi melalui kanal resmi sebelum mengambil keputusan.
              </p>
            </section>

            <section id="perubahan-syarat" className="scroll-mt-28" aria-labelledby="perubahan-syarat-title">
              <h2 id="perubahan-syarat-title" className="mb-2.5 text-lg font-bold leading-snug text-ink md:text-xl">
                5. Perubahan syarat
              </h2>
              <p className="leading-6 text-muted">
                Syarat ini dapat diperbarui sesuai perkembangan layanan. Perubahan akan ditampilkan di halaman ini beserta tanggal pembaruan. Dengan terus memakai CekLoker setelah perubahan berlaku, Anda menyetujui syarat yang diperbarui.
              </p>
            </section>
          </div>

          {/* Kotak bantuan */}
          <aside className="mt-6 rounded-card bg-navy-tint p-6" aria-labelledby="bantuan-title">
            <p id="bantuan-title" className="text-lg font-semibold leading-6 text-navy">
              Butuh bantuan?
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Hubungi kanal resmi untuk informasi dan pendampingan.
            </p>
            <ul className="mt-3 space-y-3 text-sm font-medium leading-5">
              <li>
                <a
                  href="https://kp2mi.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded text-navy underline underline-offset-2 hover:text-navy-hover"
                >
                  BP2MI/KP2MI
                </a>
              </li>
              <li>
                <a
                  href="https://kemnaker.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded text-navy underline underline-offset-2 hover:text-navy-hover"
                >
                  Kemnaker
                </a>
              </li>
              <li>
                <a
                  href="https://www.polri.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded text-navy underline underline-offset-2 hover:text-navy-hover"
                >
                  Satgas TPPO Polri
                </a>
              </li>
            </ul>
          </aside>
        </article>
      </main>

      <Footer />
    </div>
  );
}

