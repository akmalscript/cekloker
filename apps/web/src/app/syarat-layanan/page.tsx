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
          className="mx-auto w-full max-w-[768px] px-6 pb-16 pt-8 md:pt-16"
          aria-labelledby="judul"
        >
          <header>
            <h1 id="judul" className="text-[30px] font-extrabold text-ink md:text-[40px]">
              Syarat Layanan
            </h1>
            <p className="mt-3 text-sm text-muted md:mt-4">
              Terakhir diperbarui: <time dateTime="2026-11-05">5 November 2026</time>
            </p>
            <p className="mt-6 text-base text-ink leading-relaxed">
              Dengan mengakses atau menggunakan platform CekLoker, Anda menyetujui ketentuan dan syarat penggunaan layanan berikut ini.
            </p>
          </header>

          {/* Daftar Isi */}
          <nav className="card mt-6 p-6 bg-white" aria-labelledby="toc-title">
            <h2 id="toc-title" className="text-base font-semibold leading-6 tracking-normal text-ink">
              Daftar isi
            </h2>
            <ul className="mt-4 space-y-3 text-sm font-medium leading-5 text-navy">
              <li>
                <a href="#layanan-kami" className="rounded hover:underline underline-offset-4">
                  1. Layanan CekLoker
                </a>
              </li>
              <li>
                <a href="#indikasi-risiko" className="rounded hover:underline underline-offset-4">
                  2. Hasil analisis AI adalah indikasi risiko (bukan vonis hukum)
                </a>
              </li>
              <li>
                <a href="#laporan-masyarakat" className="rounded hover:underline underline-offset-4">
                  3. Ketentuan pelaporan loker masyarakat
                </a>
              </li>
              <li>
                <a href="#batasan-tanggung-jawab" className="rounded hover:underline underline-offset-4">
                  4. Batasan tanggung jawab
                </a>
              </li>
              <li>
                <a href="#perubahan-syarat" className="rounded hover:underline underline-offset-4">
                  5. Perubahan syarat &amp; ketentuan
                </a>
              </li>
            </ul>
          </nav>

          {/* Isi Syarat Layanan */}
          <div className="mt-8 space-y-8">
            <section id="layanan-kami" className="scroll-mt-28" aria-labelledby="layanan-kami-title">
              <h2 id="layanan-kami-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                1. Layanan CekLoker
              </h2>
              <p className="text-muted leading-relaxed">
                CekLoker menyediakan alat bantu cerdas berbasis kecerdasan buatan (*AI Analysis Service*) untuk mendeteksi potensi indikasi risiko penipuan kerja, skema jeratan utang, dan indikasi tindak pidana perdagangan orang (TPPO) berdasarkan analisis dokumen lowongan serta percakapan rekruter.
              </p>
            </section>

            <section id="indikasi-risiko" className="scroll-mt-28" aria-labelledby="indikasi-risiko-title">
              <h2 id="indikasi-risiko-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                2. Hasil analisis AI adalah indikasi risiko (bukan vonis hukum)
              </h2>
              <div className="space-y-3 text-muted leading-relaxed">
                <p>
                  Sesuai prinsip kehati-hatian (*duty of care*), hasil pemindaian yang disajikan merupakan alat bantu penilaian awal (*preliminary risk assessment*) dan <strong>bukan putusan hukum resmi atau jaminan mutlak bahwa lowongan pasti aman atau pasti penipuan</strong>.
                </p>
                <p>
                  Status &quot;tidak ditemukan&quot; pada pangkalan data resmi bukan bukti mutlak bahwa suatu entitas otomatis kriminal, melainkan menandakan ketiadaan jaminan pelindungan ketenagakerjaan resmi dari negara RI.
                </p>
              </div>
            </section>

            <section id="laporan-masyarakat" className="scroll-mt-28" aria-labelledby="laporan-masyarakat-title">
              <h2 id="laporan-masyarakat-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                3. Ketentuan pelaporan loker masyarakat
              </h2>
              <p className="text-muted leading-relaxed">
                Saat mengirimkan laporan dugaan lowongan penipuan melalui formulir pelaporan, pengguna wajib memberikan informasi yang faktual dan relevan. Dilarang mengirimkan laporan palsu, mencemarkan nama baik pihak sah tanpa bukti, atau mengunggah data pribadi sensitif milik pihak lain tanpa wewenang.
              </p>
            </section>

            <section id="batasan-tanggung-jawab" className="scroll-mt-28" aria-labelledby="batasan-tanggung-jawab-title">
              <h2 id="batasan-tanggung-jawab-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                4. Batasan tanggung jawab
              </h2>
              <p className="text-muted leading-relaxed">
                Platform CekLoker tidak bertanggung jawab atas keputusan penerimaan kerja, kerugian finansial, atau sengketa hubungan industrial yang terjadi antara pencari kerja dan pihak pemberi kerja. Pengguna diimbau untuk selalu memvalidasi kontrak kerja melalui dinas ketenagakerjaan setempat atau portal BP2MI/Kemnaker.
              </p>
            </section>

            <section id="perubahan-syarat" className="scroll-mt-28" aria-labelledby="perubahan-syarat-title">
              <h2 id="perubahan-syarat-title" className="mb-2 text-xl font-bold leading-[1.3] text-ink md:text-2xl">
                5. Perubahan syarat &amp; ketentuan
              </h2>
              <p className="text-muted leading-relaxed">
                Ketentuan ini dapat diperbarui sewaktu-waktu untuk menyesuaikan regulasi perundang-undangan ketenagakerjaan dan peningkatan teknologi. Tanggal pembaruan terakhir akan selalu dicantumkan di bagian atas halaman ini.
              </p>
            </section>
          </div>

          {/* Kotak Bantuan Resmi */}
          <aside className="mt-8 rounded-card bg-navy-tint p-6" aria-labelledby="bantuan-title">
            <p id="bantuan-title" className="text-lg font-semibold leading-7 text-navy">
              Saluran Pengaduan Resmi Pemerintah
            </p>
            <p className="mt-1 text-sm text-muted">
              Untuk pengaduan hukum atau darurat ketenagakerjaan luar negeri:
            </p>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-navy">
              <li>
                <a
                  href="https://kp2mi.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4"
                >
                  BP2MI / KP2MI (Crisis Center 24 Jam: 0800-1000) ↗
                </a>
              </li>
              <li>
                <a
                  href="https://kemnaker.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4"
                >
                  Kementerian Ketenagakerjaan RI ↗
                </a>
              </li>
              <li>
                <a
                  href="https://www.polri.go.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4"
                >
                  Satgas TPPO Bareskrim Polri ↗
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

