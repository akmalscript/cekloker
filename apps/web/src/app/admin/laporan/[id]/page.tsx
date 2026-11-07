"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CirclePlus,
  Clock,
  CircleCheck,
  CircleX,
  AlertTriangle,
  OctagonAlert,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  FileText,
  MessageSquare,
  User,
  Phone,
  DollarSign,
  Check,
  Shield,
  Eye,
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
          <h1 className="text-[26px] font-bold text-ink sm:text-3xl">
            Tinjau Laporan <span className="text-navy">{reportCode}</span>
          </h1>
          {isTppo && (
            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2.5 py-1 text-xs font-bold text-bahaya">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Indikasi Darurat TPPO
            </span>
          )}
        </div>

        <div>
          {report.status === "approved" ? (
            <span className="badge badge-aman">
              <CircleCheck className="h-4 w-4" aria-hidden="true" />
              Disetujui / Publik
            </span>
          ) : report.status === "rejected" ? (
            <span className="badge badge-bahaya">
              <CircleX className="h-4 w-4" aria-hidden="true" />
              Ditolak
            </span>
          ) : (
            <span className="badge border-navy-soft bg-navy-tint text-navy">
              <CirclePlus className="h-4 w-4" aria-hidden="true" />
              Menunggu Keputusan
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
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between border-b border-line pb-4">
              <h2 id="h-laporan" className="text-xl font-bold text-ink sm:text-2xl">
                Laporan dari Pengguna
              </h2>
              <span className="text-xs font-semibold text-muted bg-navy-tint px-2 py-0.5 rounded">
                Hanya-baca
              </span>
            </div>

            {/* Kronologi */}
            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted">
                Kronologi Kejadian / Indikasi Penipuan:
              </label>
              <div className="mt-2 min-h-28 rounded-card border border-line bg-canvas p-4 text-sm text-ink leading-relaxed">
                {report.chronology}
              </div>
            </div>

            {/* Meta Grid */}
            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-card border border-line p-3 bg-canvas/50">
                <dt className="text-xs text-muted">Posisi &amp; Perusahaan</dt>
                <dd className="font-bold text-ink mt-0.5">
                  {report.jobTitle || "Tidak disebutkan"}
                </dd>
                <dd className="text-xs text-muted">{report.companyName || "Perusahaan Anonim"}</dd>
              </div>

              <div className="rounded-card border border-line p-3 bg-canvas/50">
                <dt className="text-xs text-muted">Tanggal Dilaporkan</dt>
                <dd className="font-bold text-ink mt-0.5">{formatDate(report.createdAt)}</dd>
                <dd className="text-xs text-muted">Jenis: {report.type === "chat" ? "Chat Telegram/WA" : "Poster Lowongan"}</dd>
              </div>

              <div className="rounded-card border border-line p-3 bg-canvas/50">
                <dt className="text-xs text-muted flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  Kontak Pelaku
                </dt>
                <dd className="font-bold text-ink mt-0.5">
                  {report.perpetratorContact || "Tidak dicantumkan"}
                </dd>
              </div>

              <div className="rounded-card border border-line p-3 bg-canvas/50">
                <dt className="text-xs text-muted flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                  Estimasi Kerugian
                </dt>
                <dd className="font-bold text-ink mt-0.5">
                  {formatCurrency(report.financialLoss)}
                </dd>
              </div>
            </dl>

            {/* Info Pelapor */}
            <div className="mt-4 flex items-center gap-2 text-xs text-muted border-t border-line pt-3">
              <User className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span>
                Pelapor: {report.user ? `${report.user.name || "Pengguna Terdaftar"} (${report.user.email})` : "Pengguna Tamu (Anonim)"}
              </span>
            </div>
          </section>

          {/* Card 2: Pemeriksaan Terkait (AI Scan Link) */}
          {scanData ? (
            <section className="card p-6" aria-labelledby="h-periksa">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 id="h-periksa" className="text-xl font-bold text-ink sm:text-2xl">
                  Pemeriksaan Terkait
                </h2>
                <span className="text-xs font-mono text-muted">ID: {scanData.id}</span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-[100px_minmax(0,1fr)] gap-4 rounded-card border border-line bg-canvas p-4">
                {/* Visual Viewfinder / Poster Preview */}
                <div className="viewfinder h-24 w-full sm:w-24 shrink-0 rounded-card bg-navy-tint flex flex-col items-center justify-center p-2 text-center">
                  <FileText className="h-8 w-8 text-navy" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-navy mt-1">AI SCANNED</span>
                </div>

                <div className="min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-ink leading-snug">
                      {scanData.title}
                    </h3>
                    <p className="text-xs text-muted">{scanData.companyName || "Perusahaan Terdeteksi"}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {scanData.riskLevel === "bahaya" ? (
                        <span className="badge badge-bahaya">
                          <OctagonAlert className="h-3.5 w-3.5" aria-hidden="true" />
                          Bahaya ({scanData.redFlagCount} Red Flags)
                        </span>
                      ) : scanData.riskLevel === "waspada" ? (
                        <span className="badge badge-waspada">
                          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                          Waspada ({scanData.redFlagCount} Red Flags)
                        </span>
                      ) : (
                        <span className="badge badge-aman">
                          <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Aman
                        </span>
                      )}
                      <span className="text-xs text-muted">Keyakinan AI: {scanData.confidence}%</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/hasil/${scanData.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:underline"
                    >
                      <span>Lihat Hasil Analisis Lengkap</span>
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Red Flag AI List */}
              {aiFlags.length > 0 && (
                <div className="mt-5 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted">
                    Temuan Indikator Red Flag AI:
                  </label>
                  <ul className="space-y-2 mt-2">
                    {aiFlags.map((flag: any, idx: number) => (
                      <li
                        key={idx}
                        className="rounded-ctl border border-red-200 bg-red-50/50 p-3 text-xs leading-relaxed"
                      >
                        <p className="font-bold text-bahaya-ink flex items-center gap-1.5">
                          <OctagonAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {flag.label || flag.code}
                        </p>
                        <p className="mt-1 text-muted">{flag.reason}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ) : (
            <section className="card p-6" aria-labelledby="h-periksa-none">
              <h2 id="h-periksa-none" className="text-lg font-bold text-ink">
                Pemeriksaan Terkait
              </h2>
              <p className="mt-2 text-sm text-muted">
                Laporan ini dikirim langsung oleh pengguna tanpa menautkan hasil pindaian AI mandiri sebelumnya.
              </p>
            </section>
          )}

          {/* Card 3: Bukti Berkas Terlampir */}
          <section className="card p-6" aria-labelledby="h-bukti">
            <h2 id="h-bukti" className="text-xl font-bold text-ink sm:text-2xl">
              Bukti Terlampir
            </h2>
            <div className="mt-4 rounded-card border border-line bg-canvas p-4 text-sm">
              {report.evidenceUrl ? (
                <div>
                  <p className="text-xs text-muted mb-2">Tautan Dokumen / Tangkapan Layar:</p>
                  <a
                    href={report.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-navy underline hover:text-navy-hover"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Buka Berkas Bukti Pelapor
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted italic">
                  Tidak ada URL gambar eksternal yang dilampirkan pelapor. Teks kronologi di atas adalah bukti utama.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Kolom Kanan: Formulir Keputusan Admin (Sticky) */}
        <section className="card p-6 lg:sticky lg:top-24" aria-labelledby="h-putusan">
          <h2 id="h-putusan" className="text-xl font-bold text-ink sm:text-2xl">
            Keputusan Moderator
          </h2>

          {/* Sukses Alert */}
          {suksesMessage && (
            <div className="alert alert-success mt-5" role="status">
              <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-aman-ink" aria-hidden="true" />
              <p className="text-sm font-semibold">{suksesMessage}</p>
            </div>
          )}

          {/* Error Alert */}
          {formError && (
            <div className="alert alert-error mt-5" role="alert">
              <OctagonAlert className="mt-0.5 h-5 w-5 shrink-0 text-bahaya-ink" aria-hidden="true" />
              <p className="text-sm font-semibold">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6" noValidate>
            {/* Pilihan Radio Keputusan */}
            <fieldset>
              <legend className="field-label !text-sm">Tindakan Moderasi:</legend>
              <div className="mt-3 space-y-3">
                <label
                  className={`choice ${
                    keputusan === "terima"
                      ? "!border-navy !bg-navy-tint font-bold text-navy"
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
                  <div>
                    <span className="block font-bold">Setujui &amp; Publikasikan</span>
                    <span className="block text-xs font-normal text-muted">
                      Masukkan ke Basis Data Loker Publik &amp; perbarui database deteksi pHash scam.
                    </span>
                  </div>
                </label>

                <label
                  className={`choice ${
                    keputusan === "tolak"
                      ? "!border-bahaya !bg-red-50 font-bold text-bahaya"
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
                  <div>
                    <span className="block font-bold">Tolak Laporan</span>
                    <span className="block text-xs font-normal text-muted">
                      Laporan ditandai tidak valid / kurang bukti, tidak dipublikasikan ke database.
                    </span>
                  </div>
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

            {/* Catatan Admin / Alasan Penolakan */}
            <div className="mt-5">
              <label htmlFor="catatan" className="field-label !text-sm">
                Catatan Internal / Alasan Penolakan
              </label>
              <textarea
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={4}
                className="input mt-2 h-28 resize-y py-2.5 text-sm leading-relaxed"
                placeholder={
                  keputusan === "tolak"
                    ? "Wajib tulis alasan penolakan (misal: bukti tidak cukup, nomor kontak salah, nama PT tidak relevan)..."
                    : "Catatan internal verifikator (opsional)..."
                }
              />
              <p className="mt-1.5 text-xs text-muted">
                Catatan ini disimpan untuk arsip tim moderasi.
              </p>
            </div>

            {/* Checkbox Anonimitas */}
            <label className="mt-5 flex items-start gap-3 text-xs leading-normal cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonim}
                onChange={(e) => setIsAnonim(e.target.checked)}
                className="check mt-0.5"
              />
              <span className="text-muted">
                Identitas pelapor tetap terlindungi dan <strong className="text-ink">tidak ditampilkan</strong> ke pengunjung basis data loker publik.
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

