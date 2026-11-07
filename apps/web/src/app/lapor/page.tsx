"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  Info,
  CheckCircle,
  ExternalLink,
  OctagonAlert,
  TriangleAlert,
  ShieldCheck,
  AlertCircle,
  Upload,
} from "lucide-react";
import type { StoredScan } from "@/lib/store";

function LaporForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const scanIdParam = searchParams.get("scan_id") || searchParams.get("id") || "";
  const posParam = searchParams.get("pos") || "";
  const orgParam = searchParams.get("org") || "";

  // Form State
  const [scanId, setScanId] = useState<string | null>(scanIdParam || null);
  const [linkedScan, setLinkedScan] = useState<StoredScan | null>(null);
  const [detached, setDetached] = useState(false);

  const [jobTitle, setJobTitle] = useState(posParam);
  const [companyName, setCompanyName] = useState(orgParam);
  const [contact, setContact] = useState("");
  const [lossAmount, setLossAmount] = useState("");
  const [chronology, setChronology] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch linked scan if scanId is provided
  useEffect(() => {
    if (!scanIdParam) return;

    async function loadScan() {
      try {
        const res = await fetch(`/api/scan/${scanIdParam}`);
        if (res.ok) {
          const data: StoredScan = await res.json();
          setLinkedScan(data);
          if (!posParam && data.result?.extracted?.position) {
            setJobTitle(data.result.extracted.position);
          }
          if (!orgParam && data.result?.extracted?.company) {
            setCompanyName(data.result.extracted.company);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch linked scan:", e);
      }
    }

    loadScan();
  }, [scanIdParam, posParam, orgParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!chronology.trim()) {
      setError("Ceritakan apa yang mencurigakan secara jelas.");
      return;
    }

    if (!agreed) {
      setError("Anda wajib menyetujui ketentuan pelaporan sebelum mengirim.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanId: detached ? null : scanId,
          jobTitle: jobTitle || undefined,
          companyName: companyName || undefined,
          perpetratorContact: contact || undefined,
          financialLoss: lossAmount || undefined,
          chronology: chronology.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal mengirim laporan. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submit report error:", err);
      setError("Terjadi kesalahan sistem saat mengirim laporan.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Navbar />

      <main id="konten" className="flex-1 grid-paper">
        <div className="container-page max-w-[1264px] pb-12 pt-6 md:pb-16 md:pt-10">
          <Link
            href={scanId ? `/hasil/${scanId}` : "/database-loker"}
            className="inline-flex min-h-[40px] items-center gap-2 rounded text-[15px] font-semibold text-navy underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali</span>
          </Link>

          <h1 className="mt-2 text-[32px] md:text-[40px] font-extrabold text-ink">
            Laporkan Loker Ini
          </h1>

          <div className="alert alert-info mt-4 items-center">
            <Info className="h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
            <p className="text-sm">
              Laporan Anda akan ditinjau secara independen oleh tim verifikator CekLoker demi melindungi pencari kerja lainnya. Identitas Anda dirahasiakan.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            {/* Form Pelaporan */}
            <div className="card p-6 sm:p-8 bg-white">
              {submitted ? (
                <div id="sukses" role="status" className="space-y-6">
                  <div className="alert border-aman bg-white">
                    <CheckCircle
                      className="mt-0.5 h-6 w-6 shrink-0 text-aman-ink"
                      aria-hidden="true"
                    />
                    <div>
                      <h2 className="text-lg font-bold text-ink">Laporan berhasil terkirim!</h2>
                      <p className="mt-1 text-sm text-muted leading-relaxed">
                        Terima kasih atas kontribusi Anda. Tim moderator akan memeriksa bukti laporan Anda. Jika terbukti mengandung pola penipuan atau TPPO, temuan ini akan diterbitkan di Database Loker untuk memperingatkan publik.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link href="/database-loker" className="btn btn-primary min-h-[48px]">
                      Lihat Database Loker
                    </Link>
                    <Link href="/cekloker" className="btn btn-ghost min-h-[48px]">
                      Cek Lowongan Lain
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  {error && (
                    <div className="alert alert-error" role="alert">
                      <AlertCircle className="h-5 w-5 shrink-0 text-bahaya" aria-hidden="true" />
                      <p className="text-sm font-semibold">{error}</p>
                    </div>
                  )}

                  {/* Pemeriksaan Terkait (Jika ada scanId) */}
                  {scanId && (
                    <section aria-labelledby="terkait-label">
                      <p id="terkait-label" className="field-label">
                        Pemeriksaan terkait (opsional)
                      </p>

                      {!detached && linkedScan ? (
                        <div className="mt-2 rounded-card border border-line bg-canvas p-4">
                          <div className="flex items-center gap-4">
                            <div className="db-thumb !h-16 !w-16 shrink-0" aria-hidden="true">
                              <div className="db-thumb-in text-[9px]">
                                <b>LOKER</b>
                                <span className="skeleton w-full mt-1" />
                                <span className="skeleton w-3/4" />
                              </div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold leading-snug text-ink truncate">
                                {linkedScan.result?.extracted?.position || "Pemeriksaan Lowongan"}
                              </p>
                              <p className="mt-1 text-[13px] leading-snug text-muted truncate">
                                Perusahaan: {linkedScan.result?.extracted?.company || "Tidak tersedia"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line/60 pt-2">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span className="font-mono text-xs text-muted">ID: {scanId}</span>
                              <span
                                className={`badge ${
                                  linkedScan.result?.risk_level === "bahaya"
                                    ? "badge-bahaya"
                                    : linkedScan.result?.risk_level === "waspada"
                                    ? "badge-waspada"
                                    : "badge-aman"
                                }`}
                              >
                                {linkedScan.result?.risk_level === "bahaya" ? (
                                  <OctagonAlert aria-hidden="true" />
                                ) : linkedScan.result?.risk_level === "waspada" ? (
                                  <TriangleAlert aria-hidden="true" />
                                ) : (
                                  <ShieldCheck aria-hidden="true" />
                                )}
                                <span className="capitalize">{linkedScan.result?.risk_level}</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDetached(true)}
                              className="btn btn-ghost btn-xs text-muted hover:text-bahaya-ink"
                            >
                              Lepas
                            </button>
                          </div>
                        </div>
                      ) : detached ? (
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-card border border-line bg-canvas p-4">
                          <p className="text-sm text-muted">Tidak ada pemeriksaan yang ditautkan.</p>
                          <button
                            type="button"
                            onClick={() => setDetached(false)}
                            className="btn btn-ghost btn-xs text-navy font-semibold"
                          >
                            Tautkan kembali
                          </button>
                        </div>
                      ) : null}
                    </section>
                  )}

                  {/* Informasi Entitas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="jobTitle" className="field-label">
                        Posisi Pekerjaan
                      </label>
                      <input
                        id="jobTitle"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="Contoh: Customer Service Kamboja"
                        className="input mt-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="companyName" className="field-label">
                        Nama Perusahaan / Perekrut
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Contoh: PT Fiktif Jaya"
                        className="input mt-2"
                      />
                    </div>
                  </div>

                  {/* Nomor Kontak Pelaku & Kerugian */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact" className="field-label">
                        Nomor Kontak Pelaku (Opsional)
                      </label>
                      <input
                        id="contact"
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="WhatsApp / Username Telegram"
                        className="input mt-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="lossAmount" className="field-label">
                        Estimasi Kerugian Uang (Jika ada)
                      </label>
                      <input
                        id="lossAmount"
                        type="text"
                        value={lossAmount}
                        onChange={(e) => setLossAmount(e.target.value)}
                        placeholder="Rp 0 atau nominal yang ditransfer"
                        className="input mt-2"
                      />
                    </div>
                  </div>

                  {/* Kronologi Kecurigaan */}
                  <div>
                    <label htmlFor="cerita" className="field-label">
                      Ceritakan apa yang mencurigakan <span className="text-bahaya">*</span>
                    </label>
                    <textarea
                      id="cerita"
                      name="cerita"
                      rows={5}
                      value={chronology}
                      onChange={(e) => setChronology(e.target.value)}
                      placeholder="Jelaskan modusnya, misalnya diminta transfer uang tiket/seragam, dipaksa pindah ke Telegram, ditawari visa turis, atau diancam penahanan dokumen..."
                      className="input mt-2 !h-auto py-3 leading-relaxed"
                      required
                    />
                    <p className="mt-2 text-xs text-muted">
                      ⚠️ <strong>Privasi:</strong> Mohon jangan mencantumkan NIK, foto KTP asli, atau nomor rekening pribadi Anda di kotak ini.
                    </p>
                  </div>

                  {/* Checkbox Persetujuan */}
                  <div className="pt-2">
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-ink">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-field text-navy focus:ring-navy"
                        required
                      />
                      <span>
                        Saya menyatakan data yang saya kirimkan adalah benar berdasarkan pengalaman/bukti nyata. Laporan ini akan diperiksa oleh admin dan identitas saya dirahasiakan dari publik.
                      </span>
                    </label>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-full sm:w-auto min-h-[48px] px-8"
                    >
                      {loading && <span className="spinner" aria-hidden="true" />}
                      <span>{loading ? "Mengirim Laporan..." : "Kirim Laporan"}</span>
                    </button>
                    <Link
                      href={scanId ? `/hasil/${scanId}` : "/database-loker"}
                      className="btn btn-ghost w-full sm:w-auto min-h-[48px]"
                    >
                      Batal
                    </Link>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar Bantuan Resmi */}
            <aside className="card p-6 bg-white space-y-4" aria-labelledby="bantuan-judul">
              <div>
                <h2 id="bantuan-judul" className="text-xl font-bold text-ink">
                  Perlu bantuan segera?
                </h2>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  Laporan di platform CekLoker ditujukan untuk pengarsipan komunitas dan peringatan publik. Jika Anda atau kerabat sedang dalam bahaya darurat atau menjadi korban tindak pidana, segera hubungi kanal pengaduan resmi pemerintah RI:
                </p>
              </div>

              <ul className="space-y-2 pt-2">
                <li>
                  <a
                    href="https://kp2mi.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-ctl p-3 text-sm font-semibold text-navy bg-navy-tint hover:bg-navy-soft transition-colors"
                  >
                    <span>BP2MI / KP2MI (Pelindungan PMI)</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://kemnaker.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-ctl p-3 text-sm font-semibold text-navy bg-navy-tint hover:bg-navy-soft transition-colors"
                  >
                    <span>Kementerian Ketenagakerjaan (Kemnaker)</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.polri.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-ctl p-3 text-sm font-semibold text-navy bg-navy-tint hover:bg-navy-soft transition-colors"
                  >
                    <span>Satgas TPPO Bareskrim Polri</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.lapor.go.id"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 rounded-ctl p-3 text-sm font-semibold text-navy bg-navy-tint hover:bg-navy-soft transition-colors"
                  >
                    <span>SP4N-LAPOR! Layanan Pengaduan Nasional</span>
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LaporPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-canvas">
          <div className="spinner border-navy" />
        </div>
      }
    >
      <LaporForm />
    </Suspense>
  );
}

