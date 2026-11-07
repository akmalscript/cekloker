import Link from "next/link";
import {
  ArrowRight,
  ImageUp,
  ScanSearch,
  Fingerprint as FingerprintIcon,
  Landmark,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { RiskBadge } from "@/components/ui/Badge";
import { HeroScanner } from "@/components/landing/HeroScanner";
import { FaqAccordion } from "@/components/landing/FaqAccordion";

export default function HomePage() {
  return (
    <>
      <a href="#konten" className="skip-link">
        Lewati ke konten utama
      </a>

      <Navbar />

      <main id="konten" className="flex-1">
        {/* ================= HERO ================= */}
        <section
          id="hero"
          className="grid-paper relative scroll-mt-16 overflow-hidden border-b border-line"
          aria-labelledby="hero-title"
        >
          <div className="container-page grid items-center gap-8 pt-8 pb-12 sm:pt-10 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:pt-10 lg:pb-20">
            <div className="max-w-xl">
              <h1 id="hero-title" className="text-[40px] sm:text-5xl lg:text-[56px]">
                Cek dulu sebelum melamar
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted">
                Unggah screenshot lowongan atau chat perekrut. CekLoker menandai tanda bahaya
                langsung di gambar, lengkap dengan alasannya.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/cekloker" className="btn btn-primary">
                  Cek Loker Sekarang
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <Link href="/#cara-kerja" className="btn btn-secondary">
                  Lihat Cara Kerja
                </Link>
              </div>
            </div>

            {/* Poster scanner animation */}
            <HeroScanner />
          </div>
        </section>

        {/* ================= MASALAH ================= */}
        <section className="bg-white py-16 sm:py-20" aria-labelledby="masalah-title">
          <div className="container-page">
            <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-12">
              <div>
                <h2 id="masalah-title" className="eyebrow">
                  Masalah
                </h2>
                <p className="mt-2 text-[64px] font-extrabold leading-none tracking-tight text-navy sm:text-[80px] lg:text-[96px]">
                  7.908
                </p>
              </div>
              <div className="md:border-l md:border-line md:pl-12">
                <p className="max-w-2xl text-xl font-semibold leading-relaxed text-ink sm:text-2xl sm:leading-relaxed">
                  iklan loker luar negeri fiktif diturunkan pemerintah sepanjang Januari–Agustus
                  2026, tapi iklan serupa terus muncul lagi lewat akun baru.
                </p>
                <p className="mt-4 text-[13px] text-muted">
                  Sumber: Komdigi &amp; Kementerian Pelindungan Pekerja Migran Indonesia (P2MI)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CARA KERJA ================= */}
        <section
          id="cara-kerja"
          className="scroll-mt-16 border-y border-line py-16 sm:py-24"
          aria-labelledby="cara-kerja-title"
        >
          <div className="container-page">
            <h2 id="cara-kerja-title" className="text-3xl sm:text-4xl">
              Cara Kerja
            </h2>

            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {/* Langkah 1 */}
              <li className="card card-hover flex flex-col p-6">
                <div
                  className="grid h-40 place-items-center rounded-lg border border-line bg-canvas"
                  aria-hidden="true"
                >
                  <div className="flex w-[72%] flex-col items-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-5">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-tint text-navy">
                      <ImageUp className="h-5 w-5" />
                    </span>
                    <span className="skeleton w-3/4"></span>
                    <span className="skeleton w-1/2 !bg-slate-100"></span>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    1
                  </span>
                  <h3 className="text-xl">
                    <span className="sr-only">Langkah 1: </span>Unggah
                  </h3>
                </div>
                <p className="mt-3 text-muted">
                  Screenshot poster lowongan atau chat perekrut, atau tempel teksnya secara manual.
                </p>
              </li>

              {/* Langkah 2 */}
              <li className="card card-hover flex flex-col p-6">
                <div
                  className="grid h-40 place-items-center rounded-lg border border-line bg-canvas"
                  aria-hidden="true"
                >
                  <div className="flex w-[78%] flex-col gap-4 rounded-lg border border-line bg-white px-5 pb-4 pt-5">
                    <span className="skeleton w-2/3 !h-2.5 !bg-slate-300"></span>
                    <span className="relative block">
                      <span className="skeleton w-full"></span>
                      <span className="evidence-box">
                        <span className="evidence-label">Gaji tidak wajar</span>
                      </span>
                    </span>
                    <span className="skeleton w-4/5"></span>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    2
                  </span>
                  <h3 className="text-xl">
                    <span className="sr-only">Langkah 2: </span>AI menandai red flag
                  </h3>
                </div>
                <p className="mt-3 text-muted">
                  Setiap tanda bahaya ditandai langsung di gambar, lengkap dengan buktinya.
                </p>
              </li>

              {/* Langkah 3 */}
              <li className="card card-hover flex flex-col p-6">
                <div
                  className="grid h-40 place-items-center rounded-lg border border-line bg-canvas"
                  aria-hidden="true"
                >
                  <div className="w-[84%] rounded-lg border border-line bg-white p-4">
                    <span className="skeleton w-1/2 !bg-slate-300"></span>
                    <div className="mt-4 grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
                      <span className="rounded-md border border-line py-1.5 text-slate-500">
                        Aman
                      </span>
                      <span className="rounded-md border border-line py-1.5 text-slate-500">
                        Waspada
                      </span>
                      <span className="rounded-md border-2 border-bahaya bg-bahaya-tint py-1 text-bahaya-ink">
                        Bahaya
                      </span>
                    </div>
                    <span className="skeleton mt-4 w-4/5 !bg-slate-100"></span>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white"
                    aria-hidden="true"
                  >
                    3
                  </span>
                  <h3 className="text-xl">
                    <span className="sr-only">Langkah 3: </span>Lihat hasil
                  </h3>
                </div>
                <p className="mt-3 text-muted">
                  Dapatkan tingkat risiko, evaluasi dasar hukum, dan saran langkah berikutnya.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* ================= FITUR ================= */}
        <section
          id="fitur"
          className="scroll-mt-16 bg-white py-16 sm:py-24"
          aria-labelledby="fitur-title"
        >
          <div className="container-page">
            <h2 id="fitur-title" className="text-3xl sm:text-4xl">
              Fitur Utama
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <article className="card card-hover p-6">
                <span className="viewfinder" aria-hidden="true">
                  <ScanSearch className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl">Deteksi red flag</h3>
                <p className="mt-3 text-muted">
                  Gaji tidak wajar, visa turis, permintaan biaya di muka, hingga penahanan paspor.
                </p>
              </article>
              <article className="card card-hover p-6">
                <span className="viewfinder" aria-hidden="true">
                  <FingerprintIcon className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl">Pencocokan laporan</h3>
                <p className="mt-3 text-muted">
                  Kenali poster yang pernah dilaporkan sebagai penipuan, walau sudah diedit atau dipotong.
                </p>
              </article>
              <article className="card card-hover p-6">
                <span className="viewfinder" aria-hidden="true">
                  <Landmark className="h-6 w-6" />
                </span>
                <h3 className="mt-6 text-xl">Cek jalur resmi</h3>
                <p className="mt-3 text-muted">
                  Cocokkan nama perusahaan dengan data resmi penempatan pekerja migran (P3MI / BP2MI).
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ================= CONTOH HASIL ================= */}
        <section
          id="contoh-hasil"
          className="scroll-mt-16 border-y border-line py-16 sm:py-24"
          aria-labelledby="hasil-title"
        >
          <div className="container-page">
            <h2 id="hasil-title" className="text-3xl sm:text-4xl">
              Contoh Hasil Pemeriksaan
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {/* Contoh Aman */}
              <article className="card card-hover flex flex-col p-6" aria-labelledby="hasil-aman">
                <div className="rounded-lg border border-line bg-canvas p-5" aria-hidden="true">
                  <div className="flex flex-col gap-5 rounded-md bg-white px-4 pb-4 pt-5">
                    <span className="skeleton w-2/3 !h-2.5 !bg-slate-300"></span>
                    <span className="skeleton w-full"></span>
                    <span className="relative block">
                      <span className="skeleton w-3/5"></span>
                      <span className="evidence-box is-aman">
                        <span className="evidence-label">Sumber resmi cocok</span>
                      </span>
                    </span>
                  </div>
                </div>
                <h3 id="hasil-aman" className="mt-6">
                  <RiskBadge status="aman" />
                </h3>
                <p className="mt-3 text-muted">
                  Tidak ditemukan red flag. Perusahaan terdaftar di sumber resmi P3MI Kemnaker.
                </p>
              </article>

              {/* Contoh Waspada */}
              <article
                className="card card-hover flex flex-col p-6"
                aria-labelledby="hasil-waspada"
              >
                <div className="rounded-lg border border-line bg-canvas p-5" aria-hidden="true">
                  <div className="flex flex-col gap-5 rounded-md bg-white px-4 pb-4 pt-5">
                    <span className="skeleton w-2/3 !h-2.5 !bg-slate-300"></span>
                    <span className="relative block">
                      <span className="skeleton w-full"></span>
                      <span className="evidence-box is-waspada">
                        <span className="evidence-label">Gaji tidak wajar</span>
                      </span>
                    </span>
                    <span className="skeleton w-3/5"></span>
                  </div>
                </div>
                <h3 id="hasil-waspada" className="mt-6">
                  <RiskBadge status="waspada" />
                </h3>
                <p className="mt-3 text-muted">
                  Gaji tidak wajar untuk posisi tanpa pengalaman. Konfirmasi ulang ke kanal resmi.
                </p>
              </article>

              {/* Contoh Bahaya */}
              <article
                className="card card-hover flex flex-col p-6"
                aria-labelledby="hasil-bahaya"
              >
                <div className="rounded-lg border border-line bg-canvas p-5" aria-hidden="true">
                  <div className="flex flex-col gap-5 rounded-md bg-white px-4 pb-4 pt-5">
                    <span className="skeleton w-2/3 !h-2.5 !bg-slate-300"></span>
                    <span className="relative block">
                      <span className="skeleton w-full"></span>
                      <span className="evidence-box">
                        <span className="evidence-label">Visa turis</span>
                      </span>
                    </span>
                    <span className="relative block">
                      <span className="skeleton w-3/5"></span>
                      <span className="evidence-box">
                        <span className="evidence-label">Penahanan paspor</span>
                      </span>
                    </span>
                  </div>
                </div>
                <h3 id="hasil-bahaya" className="mt-6">
                  <RiskBadge status="bahaya" />
                </h3>
                <p className="mt-3 text-muted">
                  Diminta berangkat dengan visa turis dan menitipkan paspor ke agen penempatan.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* ================= FAQ ================= */}
        <section
          id="faq"
          className="scroll-mt-16 bg-white py-16 sm:py-24"
          aria-labelledby="faq-title"
        >
          <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <h2 id="faq-title" className="text-3xl sm:text-4xl">
              Pertanyaan yang Sering Diajukan
            </h2>
            <FaqAccordion />
          </div>
        </section>

        {/* ================= AJAKAN PENUTUP ================= */}
        <section className="bg-white pb-16 sm:pb-24" aria-labelledby="cta-title">
          <div className="container-page">
            <div className="on-navy grid-paper-navy relative overflow-hidden rounded-card bg-navy px-6 py-12 sm:px-12 sm:py-16">
              <span
                className="pointer-events-none absolute left-4 top-4 h-6 w-6 rounded-tl-md border-l-2 border-t-2 border-white/30 sm:left-6 sm:top-6"
                aria-hidden="true"
              ></span>
              <span
                className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 rounded-br-md border-b-2 border-r-2 border-white/30 sm:bottom-6 sm:right-6"
                aria-hidden="true"
              ></span>
              <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 id="cta-title" className="text-3xl !text-white sm:text-4xl">
                    Ragu dengan sebuah lowongan?
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-white/85">
                    Cek dulu dalam hitungan detik, gratis dan tanpa harus mendaftar akun.
                  </p>
                </div>
                <Link href="/cekloker" className="btn btn-white shrink-0 self-start md:self-auto">
                  Cek Loker Sekarang
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PERINGATAN / DISCLAIMER ================= */}
        <section className="border-t border-line py-12" aria-label="Catatan penting">
          <div className="container-page">
            <DisclaimerBanner className="mx-auto max-w-3xl" />
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
