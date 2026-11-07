"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  CirclePlus,
  Clock,
  CircleCheck,
  CircleX,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  FileText,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

interface ReportItem {
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
  createdAt: string;
  scan?: {
    id: string;
    riskLevel: string;
  } | null;
}

export default function AdminLaporanPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("terbaru");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (statusFilter) params.set("status", statusFilter);
      if (urgencyFilter) params.set("urgency", urgencyFilter);
      if (sortOrder) params.set("urutkan", sortOrder);
      params.set("page", String(page));
      params.set("limit", "10");

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setTotalCount(data.total || 0);
        setNewCount(data.newCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error("Gagal memuat antrean laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [searchQuery, statusFilter, urgencyFilter, sortOrder, page]);

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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "baru":
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-navy-tint px-2 py-1 text-xs font-bold text-navy">
            <CirclePlus className="h-3.5 w-3.5" style={{ strokeWidth: 2.5 }} aria-hidden="true" />
            Baru
          </span>
        );
      case "reviewing":
      case "ditinjau":
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-line bg-white px-2 py-1 text-xs font-bold text-ink">
            <Clock className="h-3.5 w-3.5" style={{ strokeWidth: 2.5 }} aria-hidden="true" />
            Ditinjau
          </span>
        );
      case "approved":
      case "disetujui":
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-aman-line bg-aman-tint px-2 py-1 text-xs font-bold text-aman-ink">
            <CircleCheck className="h-3.5 w-3.5" style={{ strokeWidth: 2.5 }} aria-hidden="true" />
            Disetujui
          </span>
        );
      case "rejected":
      case "ditolak":
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-bahaya-line bg-bahaya-tint px-2 py-1 text-xs font-bold text-bahaya-ink">
            <CircleX className="h-3.5 w-3.5" style={{ strokeWidth: 2.5 }} aria-hidden="true" />
            Ditolak
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-navy-tint px-2 py-1 text-xs font-bold text-navy">
            {status}
          </span>
        );
    }
  };

  return (
    <main id="konten" className="mx-auto w-full max-w-[1248px] px-4 pb-12 pt-8 sm:px-6 md:pb-16 md:pt-10">
      {/* Page Title & Count Pill */}
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <div>
          <h1 className="text-[28px] font-bold text-ink md:text-4xl">Laporan Masuk</h1>
          <p className="mt-2 text-muted md:mt-3">
            Tinjau laporan masyarakat sebelum masuk ke basis data loker publik.
          </p>
        </div>
        <p className="rounded-lg bg-navy-tint px-3 py-1.5 text-xs font-bold text-navy md:py-2 md:text-[13px] md:leading-5">
          {newCount} laporan baru
        </p>
      </div>

      {/* Filter and Search Form */}
      <div className="card mt-6 p-4 md:mt-8 md:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_180px_180px_160px] md:gap-5">
          {/* Search Input */}
          <div>
            <label htmlFor="cari" className="field-label !text-[13px] leading-5">
              Cari laporan
            </label>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="cari"
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="input h-10 !pl-10 text-sm md:h-[42px]"
                placeholder="Posisi, perusahaan, kontak, ID"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="field-label !text-[13px] leading-5">
              Status
            </label>
            <div className="relative mt-2">
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="input h-10 cursor-pointer appearance-none !pr-10 text-sm md:h-[42px]"
              >
                <option value="">Semua Status</option>
                <option value="baru">Baru</option>
                <option value="ditinjau">Ditinjau</option>
                <option value="disetujui">Disetujui</option>
                <option value="ditolak">Ditolak</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Urgency Filter */}
          <div>
            <label htmlFor="urgency" className="field-label !text-[13px] leading-5">
              Tingkat Urgensi
            </label>
            <div className="relative mt-2">
              <select
                id="urgency"
                value={urgencyFilter}
                onChange={(e) => {
                  setUrgencyFilter(e.target.value);
                  setPage(1);
                }}
                className="input h-10 cursor-pointer appearance-none !pr-10 text-sm md:h-[42px]"
              >
                <option value="">Semua Urgensi</option>
                <option value="darurat_tppo">Darurat TPPO 🚨</option>
                <option value="reguler">Reguler</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Sort Order */}
          <div>
            <label htmlFor="urutkan" className="field-label !text-[13px] leading-5">
              Urutkan
            </label>
            <div className="relative mt-2">
              <select
                id="urutkan"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setPage(1);
                }}
                className="input h-10 cursor-pointer appearance-none !pr-10 text-sm md:h-[42px]"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <p className="mt-4 text-[13px] leading-5 text-muted" role="status">
          Menampilkan {reports.length} dari {totalCount} laporan.
        </p>
      </div>

      {/* Reports List Section */}
      <section className="mt-6" aria-labelledby="daftar-title">
        <h2 id="daftar-title" className="sr-only">
          Daftar laporan antrean moderasi
        </h2>

        {loading ? (
          <div className="card p-12 text-center">
            <div className="spinner mx-auto !border-navy !border-t-transparent" />
            <p className="mt-4 text-sm text-muted">Memuat antrean laporan...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-base font-bold text-ink">Tidak ada laporan yang sesuai kriteria.</p>
            <p className="mt-1 text-sm text-muted">
              Coba ganti kata kunci pencarian atau bersihkan filter status dan urgensi.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (lg:block) */}
            <div className="hidden overflow-hidden rounded-card border border-line bg-white lg:block">
              <table className="w-full table-fixed border-separate border-spacing-0 text-left">
                <caption className="sr-only">Laporan masuk terbaru</caption>
                <colgroup>
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "13%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className="h-14 bg-navy-tint px-4 text-[13px] font-semibold text-muted xl:px-6">
                      ID Laporan
                    </th>
                    <th scope="col" className="h-14 bg-navy-tint px-4 text-[13px] font-semibold text-muted xl:px-6">
                      Posisi - Perusahaan
                    </th>
                    <th scope="col" className="h-14 bg-navy-tint px-4 text-[13px] font-semibold text-muted xl:px-6">
                      Tanggal
                    </th>
                    <th scope="col" className="h-14 bg-navy-tint px-4 text-[13px] font-semibold text-muted xl:px-6">
                      Jenis
                    </th>
                    <th scope="col" className="h-14 bg-navy-tint px-4 text-[13px] font-semibold text-muted xl:px-6">
                      Urgensi
                    </th>
                    <th scope="col" className="h-14 bg-navy-tint px-4 text-[13px] font-semibold text-muted xl:px-6">
                      Status
                    </th>
                    <th scope="col" className="h-14 bg-navy-tint px-4 text-[13px] font-semibold text-muted xl:px-6">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((item) => {
                    const identifier = item.reportCode || item.id;
                    const isTppo = item.urgency === "darurat_tppo";

                    return (
                      <tr key={item.id} className="hover:bg-canvas transition-colors">
                        <td className="h-20 border-t border-line px-4 text-[13px] font-medium text-muted xl:px-6">
                          {identifier}
                        </td>
                        <td className="h-20 border-t border-line px-4 xl:px-6">
                          <p className="text-sm font-semibold leading-5 text-ink">
                            {item.jobTitle || "Tidak disebutkan"}
                          </p>
                          <p className="text-[13px] leading-5 text-muted truncate">
                            {item.companyName || "Perusahaan Anonim"}
                          </p>
                        </td>
                        <td className="h-20 border-t border-line px-4 text-[13px] text-muted xl:px-6">
                          <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                        </td>
                        <td className="h-20 border-t border-line px-4 text-[13px] text-muted xl:px-6">
                          <span className="inline-flex items-center gap-1">
                            {item.type === "chat" ? (
                              <>
                                <MessageSquare className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                                Chat
                              </>
                            ) : (
                              <>
                                <FileText className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                                Lowongan
                              </>
                            )}
                          </span>
                        </td>
                        <td className="h-20 border-t border-line px-4 xl:px-6">
                          {isTppo ? (
                            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-bahaya">
                              <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                              TPPO
                            </span>
                          ) : (
                            <span className="text-[13px] text-muted">Reguler</span>
                          )}
                        </td>
                        <td className="h-20 border-t border-line px-4 xl:px-6">
                          {renderStatusBadge(item.status)}
                        </td>
                        <td className="h-20 border-t border-line px-4 xl:px-6">
                          <Link
                            href={`/admin/laporan/${identifier}`}
                            className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-navy underline-offset-4 hover:underline"
                            aria-label={`Tinjau laporan ${identifier}: ${item.jobTitle || "Loker"}`}
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

            {/* Mobile Cards View (lg:hidden) */}
            <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white lg:hidden">
              {reports.map((item) => {
                const identifier = item.reportCode || item.id;
                const isTppo = item.urgency === "darurat_tppo";

                return (
                  <li key={item.id} className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-muted">{identifier}</span>
                        {isTppo && (
                          <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-bahaya">
                            <ShieldAlert className="h-3 w-3" aria-hidden="true" />
                            TPPO
                          </span>
                        )}
                      </div>
                      {renderStatusBadge(item.status)}
                    </div>

                    <h3 className="mt-2.5 text-base font-semibold leading-snug text-ink">
                      {item.jobTitle || "Tidak disebutkan"}
                    </h3>
                    <p className="mt-1 text-[13px] leading-tight text-muted">
                      {item.companyName || "Perusahaan Anonim"}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3 text-[13px] text-muted">
                      <time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time>
                      <span className="inline-flex items-center gap-1">
                        {item.type === "chat" ? (
                          <>
                            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                            Chat
                          </>
                        ) : (
                          <>
                            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                            Lowongan
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-line pt-3">
                      <Link
                        href={`/admin/laporan/${identifier}`}
                        className="btn btn-secondary btn-sm w-full sm:w-auto"
                        aria-label={`Tinjau laporan ${identifier}`}
                      >
                        <span>Tinjau Laporan</span>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="hidden text-[13px] text-muted md:block">
            Halaman {page} dari {totalPages}
          </p>
          <nav aria-label="Paginasi laporan" className="flex items-center justify-center gap-2 md:justify-end">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-ctl border border-line bg-white px-3.5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50 hover:bg-navy-tint transition-colors"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-3 text-sm font-bold text-navy">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-ctl border border-line bg-white px-3.5 text-sm font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50 hover:bg-navy-tint transition-colors"
            >
              <span>Berikutnya</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </main>
  );
}

