"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CirclePlus,
  Clock,
  ShieldCheck,
  OctagonAlert,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  FileText,
  MessageSquare,
  User,
  Phone,
  DollarSign,
} from "lucide-react";

interface ReportDetail {
  id: string;
  reportCode?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  type?: string;
  urgency?: string;
  status: string;
  perpetratorContact?: string | null;
  financialLoss?: number | null;
  chronology: string;
  evidenceUrl?: string | null;
  adminNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isAnonymous?: boolean;
  createdAt: string;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
  scan?: {
    id: string;
    title: string;
    companyName?: string | null;
    riskLevel: string;
    confidence: number;
    redFlagCount: number;
    primaryRedFlag?: string | null;
    resultJson?: any;
  } | null;
}

export default function AdminTinjauLaporanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Form decision state
  const [keputusan, setKeputusan] = useState<"terima" | "tolak" | "">("");
  const [catatan, setCatatan] = useState("");
  const [isAnonim, setIsAnonim] = useState(true);
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [suksesMessage, setSuksesMessage] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/reports/${resolvedParams.id}`);
        if (!res.ok) {
          throw new Error("Laporan tidak ditemukan");
        }
        const data = await res.json();
        setReport(data.report);
        if (data.report.status === "approved") {
          setKeputusan("terima");
        } else if (data.report.status === "rejected") {
          setKeputusan("tolak");
        }
        if (data.report.adminNotes) {
          setCatatan(data.report.adminNotes);
        }
        if (data.report.urgency === "darurat_tppo") {
          setDestination("Kamboja / Myanmar");
        } else {
          setDestination("Indonesia");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Gagal memuat laporan");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [resolvedParams.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!keputusan) {
      setFormError("Pilih salah satu keputusan (Terima atau Tolak).");
      return;
    }

    if (keputusan === "tolak" && !catatan.trim()) {
      setFormError("Tulis alasan penolakan laporan untuk keperluan audit internal.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reports/${resolvedParams.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: keputusan,
          notes: catatan,
          isAnonymous: isAnonim,
          destination,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan keputusan");
      }

      setSuksesMessage(json.message);
      if (report) {
        setReport({
          ...report,
          status: keputusan === "terima" ? "approved" : "rejected",
          adminNotes: catatan,
        });
      }
    } catch (err: any) {
      setFormError(err.message || "Terjadi kesalahan sistem saat menyimpan keputusan.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (!amount || amount <= 0) return "Tidak ada kerugian uang";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <main className="container-page py-12 text-center">
        <div className="spinner mx-auto !border-navy !border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Memuat data laporan...</p>
      </main>
    );
  }

  if (errorMsg || !report) {
    return (
      <main className="container-page py-12">
        <div className="card max-w-lg mx-auto p-6 text-center">
          <OctagonAlert className="mx-auto h-12 w-12 text-bahaya" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-ink">Laporan Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-muted">
            ID atau kode laporan yang Anda cari tidak tersedia dalam antrean sistem.
          </p>
          <div className="mt-6">
            <Link href="/admin/laporan" className="btn btn-primary">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Laporan Masuk</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const reportCode = report.reportCode || report.id;
  const isTppo = report.urgency === "darurat_tppo";
  const scanData = report.scan;
  const aiFlags = scanData?.resultJson?.flags || [];

  return (
    <main id="konten" className="container-page w-full flex-1 py-8 sm:py-10">
      {/* Navigation Back */}
      <Link
        href="/admin/laporan"
        className="-my-2 inline-flex items-center gap-2 rounded-ctl py-2 text-sm font-semibold text-navy hover:underline"
      >
        <ArrowLeft className="h-4 w-4 text-muted" aria-hidden="true" />
        <span>Kembali ke Laporan Masuk</span>
      </Link>

      {/* Header Info */}
      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] sm:text-4xl font-bold text-ink">
            Tinjau Laporan <span className="whitespace-nowrap font-mono">{reportCode}</span>
          </h1>
          {isTppo && (
            <span className="inline-flex items-center gap-1 rounded bg-bahaya-tint border border-bahaya-line px-2 py-0.5 text-xs font-bold text-bahaya-ink">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Darurat TPPO
            </span>
          )}
        </div>

        <div>
          {report.status === "approved" ? (
            <span className="badge badge-aman">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Disetujui
            </span>
          ) : report.status === "rejected" ? (
            <span className="badge badge-bahaya">
              <OctagonAlert className="h-4 w-4" aria-hidden="true" />
              Ditolak
            </span>
          ) : report.status === "reviewing" ? (
            <span className="badge border-line bg-white text-ink">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Ditinjau
            </span>
          ) : (
            <span className="badge border-navy-soft bg-navy-tint text-navy">
              <CirclePlus className="h-4 w-4" aria-hidden="true" />
              Baru
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Data Laporan vs Panel Keputusan */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        {/* Kolom Kiri: Detail Laporan & Bukti (Read-only) */}
        <div className="space-y-6">
          {/* Card 1: Data Laporan Pelapor */}
          <section className="card p-6" aria-labelledby="h-laporan">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 id="h-laporan" className="text-xl sm:text-2xl font-bold text-ink">
                Laporan dari pengguna
              </h2>
              <p className="text-[13px] text-muted">Hanya-baca</p>
            </div>

            {/* Kronologi */}
            <div className="mt-6 min-h-32 rounded-card border border-line bg-canvas p-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
              {report.chronology}
            </div>

            {/* Meta Grid */}
            <dl className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-[13px] text-muted">Tanggal lapor</dt>
                <dd className="font-semibold text-ink">{formatDate(report.createdAt)}</dd>
              </div>

              <div>
                <dt className="text-[13px] text-muted">Jenis</dt>
                <dd className="font-semibold text-ink">{report.type === "chat" ? "Chat" : "Lowongan"}</dd>
              </div>

              {report.perpetratorContact && (
                <div>
                  <dt className="text-[13px] text-muted">Kontak pelaku</dt>
                  <dd className="font-semibold text-ink text-xs sm:text-sm">{report.perpetratorContact}</dd>
                </div>
              )}

              {report.financialLoss != null && (
                <div>
                  <dt className="text-[13px] text-muted">Estimasi kerugian</dt>
                  <dd className="font-semibold text-bahaya-ink">{formatCurrency(report.financialLoss)}</dd>
                </div>
              )}
            </dl>
          </section>

          {/* Card 2: Pemeriksaan Terkait */}
          {scanData && (
            <section className="card p-6" aria-labelledby="h-periksa">
              <h2 id="h-periksa" className="text-xl sm:text-2xl font-bold text-ink">
                Pemeriksaan terkait
              </h2>

              <div className="mt-4 grid grid-cols-[80px_minmax(0,1fr)] gap-x-4 gap-y-4 rounded-card border border-line bg-canvas p-4">
                {/* Visual Viewfinder */}
                <div className="viewfinder h-20 w-20 shrink-0 rounded-card bg-navy-tint flex flex-col items-center justify-center p-2 text-center" aria-hidden="true">
                  <FileText className="h-6 w-6 text-navy" />
                  <span className="text-[9px] font-bold text-navy mt-1">AI SCAN</span>
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-snug text-ink">{scanData.title}</h3>
                  <p className="mt-1 text-[15px] leading-normal text-muted">{scanData.companyName || "Perusahaan Terdeteksi"}</p>
                  <p className="mt-1 text-[13px] leading-normal text-muted">ID Pemeriksaan: {scanData.id}</p>
                </div>

                <div className="col-span-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-line pt-3">
                  <div className="flex items-center gap-4">
                    {scanData.riskLevel === "bahaya" ? (
                      <span className="badge badge-bahaya"><OctagonAlert aria-hidden="true" />Bahaya</span>
                    ) : scanData.riskLevel === "waspada" ? (
                      <span className="badge badge-waspada"><OctagonAlert aria-hidden="true" />Waspada</span>
                    ) : (
                      <span className="badge badge-aman"><ShieldCheck aria-hidden="true" />Aman</span>
                    )}
                    <span className="hidden text-[13px] text-muted sm:inline">Keyakinan AI: {scanData.confidence}%</span>
                  </div>

                  <Link
                    href={`/hasil/${scanData.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-ctl py-2 text-[15px] font-semibold text-navy hover:underline"
                  >
                    <span>Lihat Hasil</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Card 3: Bukti Berkas */}
          <section className="card p-6" aria-labelledby="h-bukti">
            <h2 id="h-bukti" className="text-xl sm:text-2xl font-bold text-ink">
              Bukti
            </h2>
            <div className="mt-4 rounded-card border border-line bg-canvas p-4 text-sm">
              {report.evidenceUrl ? (
                <div>
                  <p className="text-xs text-muted mb-2">Berkas Bukti Pelapor:</p>
                  <a
                    href={report.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-navy underline hover:text-navy-hover"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Buka Berkas Bukti
                  </a>
                </div>
              ) : (
                <p className="text-[13px] text-muted italic">
                  Tidak ada berkas eksternal yang dilampirkan. Bukti mengacu pada kronologi laporan.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Kolom Kanan: Formulir Keputusan Admin (Sticky) */}
        <section className="card p-6 lg:sticky lg:top-24" aria-labelledby="h-putusan">
          <h2 id="h-putusan" className="text-xl sm:text-2xl font-bold text-ink">
            Keputusan
          </h2>

          {/* Sukses Alert */}
          {suksesMessage && (
            <div className="alert alert-success mt-6" role="status">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-aman-ink" aria-hidden="true" />
              <p className="text-sm font-semibold">{suksesMessage}</p>
            </div>
          )}

          {/* Error Alert */}
          {formError && (
            <div className="alert alert-error mt-6" role="alert">
              <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0 text-bahaya-ink" aria-hidden="true" />
              <p className="text-sm font-semibold">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            {/* Pilihan Radio Keputusan */}
            <fieldset>
              <legend className="sr-only">Pilih keputusan</legend>
              <div className="space-y-4">
                <label
                  className={`choice ${
                    keputusan === "terima"
                      ? "border-navy bg-navy-tint text-navy font-semibold"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="keputusan"
                    value="terima"
                    checked={keputusan === "terima"}
                    onChange={() => setKeputusan("terima")}
                    className="radio"
                  />
                  <span>Terima &amp; Masukkan ke Database</span>
                </label>

                <label
                  className={`choice ${
                    keputusan === "tolak"
                      ? "border-bahaya bg-bahaya-tint text-bahaya-ink font-semibold"
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="keputusan"
                    value="tolak"
                    checked={keputusan === "tolak"}
                    onChange={() => setKeputusan("tolak")}
                    className="radio"
                  />
                  <span>Tolak Laporan</span>
                </label>
              </div>
            </fieldset>

            {/* Input Tambahan Jika Disetujui */}
            {keputusan === "terima" && (
              <div className="mt-5 rounded-card border border-line bg-canvas p-4 space-y-4">
                <div>
                  <label htmlFor="destination" className="field-label !text-xs">
                    Negara Tujuan / Wilayah Penipuan
                  </label>
                  <input
                    id="destination"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="input h-10 mt-1 text-sm"
                    placeholder="Contoh: Kamboja, Myanmar, Indonesia"
                  />
                </div>
              </div>
            )}

            {/* Catatan Admin */}
            <div className="mt-6">
              <label htmlFor="catatan" className="field-label">
                Alasan / catatan admin (opsional)
              </label>
              <textarea
                id="catatan"
                name="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                className="input mt-2 h-40 resize-y py-3 leading-6 text-sm"
                placeholder="Tulis alasan atau catatan admin"
              />
              <p className="mt-2 text-[13px] leading-normal text-muted">
                Alasan ini hanya untuk internal, tidak ditampilkan ke pengguna.
              </p>
            </div>

            {/* Checkbox Anonimitas */}
            <label className="mt-6 flex items-start gap-4 text-[15px] leading-normal cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonim}
                onChange={(e) => setIsAnonim(e.target.checked)}
                className="check mt-0.5"
              />
              <span className="text-muted">
                Identitas pelapor tidak ditampilkan di database.
              </span>
            </label>

            {/* Submit & Cancel Buttons */}
            <div className="mt-6 space-y-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
              >
                {submitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Menyimpan Keputusan...</span>
                  </>
                ) : (
                  <span>Simpan Keputusan</span>
                )}
              </button>

              <Link href="/admin/laporan" className="btn btn-ghost w-full">
                Batal
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

