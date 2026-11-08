"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Inbox,
  Database,
  Search,
  ShieldCheck,
  OctagonAlert,
  ArrowRight,
  Clock,
  CirclePlus,
  ExternalLink,
} from "lucide-react";

interface StatsData {
  scans: {
    total: number;
    aman: number;
    waspada: number;
    bahaya: number;
  };
  reports: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    tppoEmergency: number;
  };
  verifiedScams: number;
  recentReports: Array<{
    id: string;
    reportCode?: string | null;
    jobTitle?: string | null;
    companyName?: string | null;
    type?: string;
    urgency?: string;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Gagal memuat statistik admin:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <main className="container-page py-12 text-center">
        <div className="spinner mx-auto !border-navy !border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Memuat ringkasan dasbor admin...</p>
      </main>
    );
  }

  const s = stats || {
    scans: { total: 0, aman: 0, waspada: 0, bahaya: 0 },
    reports: { total: 0, pending: 0, approved: 0, rejected: 0, tppoEmergency: 0 },
    verifiedScams: 0,
    recentReports: [],
  };

  const totalScans = Math.max(1, s.scans.total);
  const pAman = Math.round((s.scans.aman / totalScans) * 100);
  const pWaspada = Math.round((s.scans.waspada / totalScans) * 100);
  const pBahaya = Math.round((s.scans.bahaya / totalScans) * 100);

  return (
    <main id="konten" className="mx-auto w-full max-w-[1248px] px-4 pb-8 pt-8 md:px-6 md:pb-10 md:pt-10">
      {/* Judul & Aksi Cepat */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-[30px] font-bold text-ink md:text-4xl">Dasbor Administrasi</h1>
          <p className="mt-3 text-muted md:mt-4">
            Ringkasan evaluasi kecerdasan buatan, antrean moderasi, dan pengawasan TPPO.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/laporan" className="btn btn-primary btn-sm">
            <Inbox className="h-4 w-4" aria-hidden="true" />
            <span>Tinjau Laporan ({s.reports.pending})</span>
          </Link>
          <Link href="/admin/database-loker" className="btn btn-secondary btn-sm">
            <Database className="h-4 w-4" aria-hidden="true" />
            <span>Database Publik</span>
          </Link>
        </div>
      </div>

      {/* TPPO Alert Banner jika ada laporan darurat */}
      {s.reports.tppoEmergency > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-card border border-bahaya-line bg-bahaya-tint p-4 sm:p-5 text-ink">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-6 w-6 shrink-0 text-bahaya-ink mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-bahaya-ink text-sm sm:text-base">
                Peringatan Darurat: Ditemukan {s.reports.tppoEmergency} Laporan Berindikasi TPPO
              </p>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Laporan ini mendeteksi indikasi penyekapan, penahanan paspor, atau rekrutmen sindikat di luar negeri (Kamboja / Myanmar).
              </p>
            </div>
          </div>
          <Link
            href="/admin/laporan?urgency=darurat_tppo"
            className="btn btn-primary btn-sm shrink-0 !bg-bahaya hover:!bg-bahaya-ink text-white"
          >
            <span>Tinjau Laporan TPPO</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Scans */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Pemeriksaan Loker
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-ctl bg-navy-tint text-navy">
              <Search className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">{s.scans.total.toLocaleString("id-ID")}</p>
          <p className="mt-1 text-xs text-muted">Total lowongan diperiksa AI</p>

          <div className="mt-4 pt-3 border-t border-line">
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="text-aman-ink font-semibold">Aman: {s.scans.aman}</span>
              <span className="text-waspada-ink font-semibold">Waspada: {s.scans.waspada}</span>
              <span className="text-bahaya-ink font-semibold">Bahaya: {s.scans.bahaya}</span>
            </div>
            {/* Multi-segment bar */}
            <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div style={{ width: `${pAman}%` }} className="bg-aman" title={`Aman ${pAman}%`} />
              <div style={{ width: `${pWaspada}%` }} className="bg-waspada" title={`Waspada ${pWaspada}%`} />
              <div style={{ width: `${pBahaya}%` }} className="bg-bahaya" title={`Bahaya ${pBahaya}%`} />
            </div>
          </div>
        </div>

        {/* Card 2: Antrean Laporan */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Antrean Laporan
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-ctl bg-navy-tint text-navy">
              <Inbox className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-navy">{s.reports.pending}</p>
          <p className="mt-1 text-xs text-muted">Laporan baru perlu ditinjau</p>

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
            <span className="text-muted">Total masuk: {s.reports.total}</span>
            <Link
              href="/admin/laporan?status=baru"
              className="font-bold text-navy hover:underline flex items-center gap-1"
            >
              <span>Buka</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Card 3: Disetujui vs Ditolak */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Keputusan Selesai
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-ctl bg-aman-tint text-aman-ink">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">{s.reports.approved + s.reports.rejected}</p>
          <p className="mt-1 text-xs text-muted">Laporan telah diproses verifikator</p>

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold">
            <span className="text-aman-ink">Disetujui: {s.reports.approved}</span>
            <span className="text-bahaya-ink">Ditolak: {s.reports.rejected}</span>
          </div>
        </div>

        {/* Card 4: Database Loker Terverifikasi */}
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">
              Database Scam
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-ctl bg-navy-tint text-navy">
              <Database className="h-4 w-4" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">{s.verifiedScams}</p>
          <p className="mt-1 text-xs text-muted">Loker fiktif terbit di database</p>

          <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
            <span className="text-muted">Siap dicocokkan AI</span>
            <Link
              href="/admin/database-loker"
              className="font-bold text-navy hover:underline flex items-center gap-1"
            >
              <span>Katalog</span>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabel Laporan Masuk Terbaru */}
      <section className="mt-10" aria-labelledby="h-recent">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="h-recent" className="text-xl font-bold text-ink">
              Laporan Masuk Terbaru
            </h2>
            <p className="text-[13px] text-muted mt-1">
              Daftar laporan masyarakat paling akhir yang siap ditinjau tim moderasi.
            </p>
          </div>
          <Link
            href="/admin/laporan"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:underline"
          >
            <span>Lihat Semua ({s.reports.total})</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {s.recentReports.length === 0 ? (
          <div className="mt-4 card p-8 text-center text-sm text-muted">
            Belum ada laporan masyarakat yang masuk.
          </div>
        ) : (
          <>
            {/* Tampilan Desktop (Tabel) */}
            <div className="mt-4 hidden overflow-x-auto rounded-card border border-line bg-white lg:block">
              <table className="w-full text-left">
                <caption className="sr-only">Daftar laporan masyarakat terbaru</caption>
                <thead>
                  <tr className="border-b border-line bg-navy-tint text-xs font-semibold text-muted">
                    <th scope="col" className="h-12 px-4 xl:px-6">ID</th>
                    <th scope="col" className="h-12 px-4 xl:px-6">Posisi &amp; Perusahaan</th>
                    <th scope="col" className="h-12 px-4 xl:px-6">Tanggal Lapor</th>
                    <th scope="col" className="h-12 px-4 xl:px-6">Status</th>
                    <th scope="col" className="h-12 px-4 xl:px-6">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {s.recentReports.map((r) => {
                    const identifier = r.reportCode || r.id;
                    const isTppo = r.urgency === "darurat_tppo";

                    return (
                      <tr key={r.id} className="hover:bg-canvas transition-colors">
                        <td className="h-20 border-t border-line px-4 text-[13px] text-muted xl:px-6">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono">{identifier}</span>
                            {isTppo && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-bahaya-tint border border-bahaya-line px-1.5 py-0.5 text-[10px] font-bold text-bahaya-ink">
                                TPPO
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="h-20 border-t border-line px-4 xl:px-6">
                          <p className="text-sm font-semibold leading-5 text-ink">
                            {r.jobTitle || "Tidak disebutkan"}
                          </p>
                          <p className="text-[13px] leading-5 text-muted">
                            {r.companyName || "Perusahaan Anonim"}
                          </p>
                        </td>
                        <td className="h-20 border-t border-line px-4 text-[13px] text-muted xl:px-6">
                          {formatDate(r.createdAt)}
                        </td>
                        <td className="h-20 border-t border-line px-4 xl:px-6">
                          {r.status === "approved" ? (
                            <span className="badge badge-aman">
                              <ShieldCheck aria-hidden="true" />
                              Disetujui
                            </span>
                          ) : r.status === "rejected" ? (
                            <span className="badge badge-bahaya">
                              <OctagonAlert aria-hidden="true" />
                              Ditolak
                            </span>
                          ) : r.status === "reviewing" ? (
                            <span className="badge border-line bg-white text-ink">
                              <Clock aria-hidden="true" />
                              Ditinjau
                            </span>
                          ) : (
                            <span className="badge border-navy-soft bg-navy-tint text-navy">
                              <CirclePlus aria-hidden="true" />
                              Baru
                            </span>
                          )}
                        </td>
                        <td className="h-20 border-t border-line px-4 xl:px-6">
                          <Link
                            href={`/admin/laporan/${identifier}`}
                            className="inline-flex items-center gap-2 rounded text-sm font-semibold text-navy underline-offset-4 hover:underline"
                            aria-label={`Tinjau laporan ${identifier}: ${r.jobTitle || ""}`}
                          >
                            <span>Tinjau</span>
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tampilan Mobile (Daftar Kartu Sesuai Prototype) */}
            <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card border border-line bg-white lg:hidden">
              {s.recentReports.map((r) => {
                const identifier = r.reportCode || r.id;
                const isTppo = r.urgency === "darurat_tppo";

                return (
                  <li key={r.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 text-[13px] text-muted font-mono">
                        <span>{identifier}</span>
                        {isTppo && (
                          <span className="inline-flex items-center rounded bg-bahaya-tint border border-bahaya-line px-1.5 py-0.2 text-[10px] font-bold text-bahaya-ink">
                            TPPO
                          </span>
                        )}
                      </div>

                      {r.status === "approved" ? (
                        <span className="badge badge-aman">
                          <ShieldCheck aria-hidden="true" />
                          Disetujui
                        </span>
                      ) : r.status === "rejected" ? (
                        <span className="badge badge-bahaya">
                          <OctagonAlert aria-hidden="true" />
                          Ditolak
                        </span>
                      ) : r.status === "reviewing" ? (
                        <span className="badge border-line bg-white text-ink">
                          <Clock aria-hidden="true" />
                          Ditinjau
                        </span>
                      ) : (
                        <span className="badge border-navy-soft bg-navy-tint text-navy">
                          <CirclePlus aria-hidden="true" />
                          Baru
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-base font-semibold leading-6 text-ink">
                      {r.jobTitle || "Tidak disebutkan"}
                    </h3>
                    <p className="mt-1 text-[13px] leading-4 text-muted">
                      {r.companyName || "Perusahaan Anonim"}
                    </p>
                    <p className="mt-3 flex items-center justify-between gap-3 text-[13px] leading-4 text-muted">
                      <span>{formatDate(r.createdAt)}</span>
                      <span>{r.type === "chat" ? "Chat" : "Lowongan"}</span>
                    </p>

                    <div className="mt-3 flex justify-end">
                      <Link
                        href={`/admin/laporan/${identifier}`}
                        className="inline-flex h-10 items-center gap-2 rounded text-sm font-semibold text-navy underline-offset-4 hover:underline"
                        aria-label={`Tinjau laporan ${identifier}: ${r.jobTitle || ""}`}
                      >
                        <span>Tinjau</span>
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </main>
  );
}

