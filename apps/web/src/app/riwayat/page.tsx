"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Plus,
  Search,
  ListFilter,
  ChevronDown,
  Calendar,
  X,
  FileText,
  MessageSquare,
  Flag,
  Trash2,
  ChevronRight,
  ShieldCheck,
  TriangleAlert,
  OctagonAlert,
} from "lucide-react";
import type { StoredScan } from "@/lib/store";

interface HistoryItem {
  id: string;
  title: string;
  companyName: string;
  kind: "Lowongan" | "Chat";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number;
  riskLevel: "aman" | "waspada" | "bahaya";
  redFlagsCount: number;
  confidence: number;
  primaryRedFlag: string;
}

const JENIS_MAP: Record<string, string> = {
  gaji: "Gaji tidak wajar",
  biaya: "Biaya di muka",
  telegram: "Pindah ke Telegram",
  paspor: "Penahanan paspor",
  data: "Data pribadi berlebih",
};

export default function RiwayatPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState<"baru" | "lama" | "risiko">("baru");
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const PER_PAGE = 5;

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"all" | string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/masuk?callbackUrl=/riwayat");
    }
  }, [status, router]);

  // Load user scans
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchScans() {
      setLoading(true);
      try {
        const res = await fetch("/api/scans");
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          const mapped: HistoryItem[] = json.data.map((item: StoredScan) => {
            const d = new Date(item.createdAt);
            const dateStr = d.toISOString().split("T")[0];
            const timeStr = d.toTimeString().slice(0, 5);
            const title =
              item.result.extracted?.position?.trim() ||
              item.result.extracted?.company?.trim() ||
              "Pemeriksaan Lowongan";

            return {
              id: item.id,
              title,
              companyName: item.result.extracted?.company || "Tidak tersedia",
              kind: "Lowongan",
              date: dateStr,
              time: timeStr,
              timestamp: item.createdAt,
              riskLevel: item.result.risk_level,
              redFlagsCount: item.result.red_flags?.length || 0,
              confidence: Math.round((item.result.confidence || 0.8) * 100),
              primaryRedFlag: inferFlagType(item.result.red_flags),
            };
          });
          setItems(mapped);
        }
      } catch (err) {
        console.error("Gagal memuat riwayat:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchScans();
  }, [status]);

  function inferFlagType(flags: StoredScan["result"]["red_flags"]): string {
    if (!flags || flags.length === 0) return "";
    const c = flags[0].code.toLowerCase();
    if (c.includes("salary") || c.includes("gaji")) return "gaji";
    if (c.includes("fee") || c.includes("biaya")) return "biaya";
    if (c.includes("telegram") || c.includes("whatsapp")) return "telegram";
    if (c.includes("passport") || c.includes("paspor")) return "paspor";
    if (c.includes("data") || c.includes("identity")) return "data";
    return "gaji";
  }

  // Filter & Urutkan
  const filteredItems = useMemo(() => {
    return items
      .filter((x) => {
        const q = query.trim().toLowerCase();
        if (q && !(x.title + " " + x.companyName + " " + x.id).toLowerCase().includes(q)) {
          return false;
        }
        if (riskFilter && x.riskLevel !== riskFilter) {
          return false;
        }
        if (flagFilter && x.primaryRedFlag !== flagFilter) {
          return false;
        }
        if (startDate && x.date < startDate) {
          return false;
        }
        if (endDate && x.date > endDate) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "lama") return a.timestamp - b.timestamp;
        if (sortBy === "risiko") {
          const rank = { bahaya: 0, waspada: 1, aman: 2 };
          const diff = rank[a.riskLevel] - rank[b.riskLevel];
          if (diff !== 0) return diff;
          return b.timestamp - a.timestamp;
        }
        return b.timestamp - a.timestamp; // default: terbaru
      });
  }, [items, query, riskFilter, flagFilter, startDate, endDate, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const handleResetFilters = () => {
    setQuery("");
    setRiskFilter("");
    setFlagFilter("");
    setStartDate("");
    setEndDate("");
    setSortBy("baru");
    setPage(1);
  };

  const confirmDelete = (target: "all" | string) => {
    setDeleteTarget(target);
    setDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget === "all") {
        const res = await fetch("/api/scans", { method: "DELETE" });
        if (res.ok) {
          setItems([]);
        }
      } else {
        const res = await fetch(`/api/scans/${deleteTarget}`, { method: "DELETE" });
        if (res.ok) {
          setItems((prev) => prev.filter((i) => i.id !== deleteTarget));
        }
      }
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      setDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const formatDateLabel = (dStr: string) => {
    try {
      const parts = dStr.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return new Intl.DateTimeFormat("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(d);
      }
    } catch {}
    return dStr;
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center grid-paper">
          <div className="flex flex-col items-center gap-3">
            <div className="spinner border-navy" />
            <p className="text-sm font-semibold text-muted">Memuat riwayat pemeriksaan...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main id="konten" className="flex-1 grid-paper">
        <div className="container-page py-10 sm:py-12">
          {/* Header Title + Action */}
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl">Riwayat pemeriksaan</h1>
              <p className="mt-2 max-w-xl text-muted">
                Lihat kembali hasil pemeriksaan lowongan dan chat perekrut Anda.
              </p>
            </div>
            <Link
              href="/cekloker"
              className="btn btn-primary w-full shrink-0 md:w-auto md:!min-h-[40px]"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
              <span>Cek Loker Baru</span>
            </Link>
          </div>

          {/* Filter Card */}
          <section className="card mt-8 p-4 sm:p-6" aria-label="Filter riwayat">
            <form onSubmit={(e) => e.preventDefault()} className="grid gap-4 md:grid-cols-4" noValidate>
              <div className="md:col-span-2">
                <label htmlFor="q" className="field-label">
                  Cari riwayat
                </label>
                <div className="relative mt-2">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                    aria-hidden="true"
                  />
                  <input
                    id="q"
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setPage(1);
                    }}
                    className="input !pl-12"
                    placeholder="Posisi, perusahaan, atau ID"
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setFilterPanelOpen(!filterPanelOpen)}
                className="btn btn-ghost w-full !bg-navy-tint md:hidden"
                aria-expanded={filterPanelOpen}
                aria-controls="fx"
              >
                <ListFilter className="h-4 w-4" aria-hidden="true" />
                Filter
              </button>

              <div id="fx" className={`fx ${filterPanelOpen ? "is-open" : ""}`}>
                <div>
                  <label htmlFor="risiko" className="field-label">
                    Tingkat risiko
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="risiko"
                      value={riskFilter}
                      onChange={(e) => {
                        setRiskFilter(e.target.value);
                        setPage(1);
                      }}
                      className="input appearance-none !pr-10"
                    >
                      <option value="">Semua</option>
                      <option value="bahaya">Bahaya</option>
                      <option value="waspada">Waspada</option>
                      <option value="aman">Aman</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="jenis" className="field-label">
                    Jenis red flag
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="jenis"
                      value={flagFilter}
                      onChange={(e) => {
                        setFlagFilter(e.target.value);
                        setPage(1);
                      }}
                      className="input appearance-none !pr-10"
                    >
                      <option value="">Semua jenis</option>
                      <option value="gaji">Gaji tidak wajar</option>
                      <option value="biaya">Biaya di muka</option>
                      <option value="telegram">Pindah ke Telegram</option>
                      <option value="paspor">Penahanan paspor</option>
                      <option value="data">Data pribadi berlebih</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="dari" className="field-label">
                    Dari tanggal
                  </label>
                  <input
                    id="dari"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="input mt-2"
                  />
                </div>

                <div>
                  <label htmlFor="sampai" className="field-label">
                    Sampai tanggal
                  </label>
                  <input
                    id="sampai"
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="input mt-2"
                  />
                </div>

                <div>
                  <label htmlFor="urut" className="field-label">
                    Urutkan
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="urut"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="input appearance-none !pr-10"
                    >
                      <option value="baru">Terbaru</option>
                      <option value="lama">Terlama</option>
                      <option value="risiko">Risiko tertinggi</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Chip & Reset Button */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(startDate || endDate) && (
                <span className="inline-flex items-center gap-2 rounded-ctl bg-navy-tint py-1.5 pl-3 pr-1.5 text-[13px] font-semibold text-navy">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {startDate && endDate
                      ? `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}`
                      : startDate
                      ? `Mulai ${formatDateLabel(startDate)}`
                      : `Sampai ${formatDateLabel(endDate)}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="grid h-6 w-6 place-items-center rounded hover:bg-navy-soft"
                    aria-label="Hapus filter tanggal"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </span>
              )}

              {(query || riskFilter || flagFilter || startDate || endDate || sortBy !== "baru") && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="btn btn-ghost btn-sm !px-2 text-[14px]"
                >
                  Atur Ulang Filter
                </button>
              )}
            </div>
          </section>

          {/* List Count */}
          <p className="mt-8 text-[14px] text-muted">
            Menampilkan {paginatedItems.length} dari {filteredItems.length} pemeriksaan
          </p>

          {/* Cards List */}
          <ul className="mt-4 grid gap-4">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => {
                const isAman = item.riskLevel === "aman";
                const isWaspada = item.riskLevel === "waspada";
                const isBahaya = item.riskLevel === "bahaya";

                return (
                  <li
                    key={item.id}
                    className="rw card card-hover relative p-4 md:p-6"
                  >
                    {/* Thumbnail buram */}
                    <div className="rw-thumb thumb" aria-hidden="true" />

                    {/* Informasi Utama */}
                    <div className="rw-main min-w-0">
                      <h3 className="text-base !font-bold leading-snug md:text-lg">
                        <Link
                          href={`/hasil/${item.id}`}
                          className="rounded text-ink hover:text-navy after:absolute after:inset-0"
                        >
                          {item.title}
                        </Link>
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted">
                        {item.kind === "Chat" ? (
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span>{item.kind}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.companyName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-xs">{item.id}</span>
                      </p>
                      <p className="mt-1 text-[13px] text-muted">
                        <time dateTime={`${item.date}T${item.time}`}>
                          {formatDateLabel(item.date)}, {item.time} WIB
                        </time>
                      </p>
                    </div>

                    {/* Badge Tingkat Risiko */}
                    <span
                      className={`rw-badge badge ${
                        isAman
                          ? "badge-aman"
                          : isWaspada
                          ? "badge-waspada"
                          : "badge-bahaya"
                      }`}
                    >
                      {isAman && <ShieldCheck aria-hidden="true" />}
                      {isWaspada && <TriangleAlert aria-hidden="true" />}
                      {isBahaya && <OctagonAlert aria-hidden="true" />}
                      <span className="capitalize">{item.riskLevel}</span>
                    </span>

                    {/* Statistik Red Flag */}
                    <div className="rw-stats text-[13px] text-muted">
                      <span className="rw-flags inline-flex items-center gap-1.5">
                        <Flag className="h-4 w-4 text-muted" aria-hidden="true" />
                        <span>{item.redFlagsCount} red flag</span>
                      </span>
                      <span className="rw-conf">Keyakinan {item.confidence}%</span>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="rw-act flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          confirmDelete(item.id);
                        }}
                        className="btn btn-ghost btn-sm relative z-10 !px-3 hover:!bg-bahaya-tint hover:!text-bahaya-ink"
                        aria-label={`Hapus hasil pemeriksaan ${item.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>
                      <ChevronRight
                        className="hidden h-5 w-5 text-navy md:block"
                        aria-hidden="true"
                      />
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="card p-8 text-center">
                <p className="font-bold text-ink">
                  {items.length
                    ? "Tidak ada pemeriksaan yang cocok"
                    : "Riwayat kosong"}
                </p>
                <p className="mt-1 text-muted text-sm">
                  {items.length
                    ? "Ubah kata kunci atau atur ulang filter."
                    : "Hasil pemeriksaan baru yang Anda lakukan akan tersimpan di sini."}
                </p>
              </li>
            )}
          </ul>

          {/* Pagination & Hapus Seluruh Riwayat */}
          <div className="mt-8 flex flex-col items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr]">
            <span className="hidden md:block" />

            {/* Pager */}
            {totalPages > 1 && (
              <nav aria-label="Halaman riwayat" className="flex flex-wrap items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-ghost btn-sm !px-3"
                >
                  Sebelumnya
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    className={
                      pNum === currentPage
                        ? "grid h-10 min-w-10 place-items-center rounded-ctl bg-navy px-3 text-[15px] font-bold text-white"
                        : "btn btn-ghost btn-sm min-w-10"
                    }
                  >
                    {pNum}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn btn-ghost btn-sm !px-3"
                >
                  Berikutnya
                </button>
              </nav>
            )}

            {/* Tombol Hapus Seluruh Riwayat (FR-PRI-02) */}
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => confirmDelete("all")}
                className="btn btn-ghost btn-sm md:justify-self-end text-muted hover:!bg-bahaya-tint hover:!text-bahaya-ink"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Hapus Seluruh Riwayat</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Modal Dialog Konfirmasi Hapus */}
      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
        >
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-bold">
              {deleteTarget === "all"
                ? "Hapus Seluruh Riwayat?"
                : "Hapus Riwayat Pemeriksaan?"}
            </h2>
            <p className="mt-3 text-[15px] text-muted leading-relaxed">
              {deleteTarget === "all"
                ? "Tindakan ini akan menghapus seluruh data riwayat pemeriksaan akun Anda secara permanen sesuai regulasi privasi (FR-PRI-02). Data tidak dapat dikembalikan."
                : "Data pemeriksaan ini akan dihapus secara permanen dari server CekLoker."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                disabled={deleting}
                className="btn btn-ghost btn-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeDelete}
                disabled={deleting}
                className="btn btn-ghost btn-sm !bg-bahaya-tint !text-bahaya-ink font-bold"
              >
                {deleting ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

