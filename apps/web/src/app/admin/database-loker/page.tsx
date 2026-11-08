"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Download,
  Flag,
  Globe,
  OctagonAlert,
  TriangleAlert,
  SearchX,
} from "lucide-react";
import type { DatabaseLokerEntry } from "@/app/api/database-loker/route";
import { downloadDatabasePdf } from "@/lib/pdf/generate-database-pdf";

const RED_FLAGS = [
  "Biaya rekrutmen",
  "Minta data sensitif",
  "Tautan mencurigakan",
  "Gaji tidak wajar",
  "Pindah ke Telegram",
  "Penahanan paspor",
  "Visa turis",
  "Identitas tidak jelas",
  "Proses tidak wajar",
];

const COUNTRIES = ["Semua Negara", "Kamboja", "Myanmar", "Laos", "Filipina", "Indonesia"];

export default function AdminDatabaseLokerPage() {
  const [entries, setEntries] = useState<DatabaseLokerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [cari, setCari] = useState("");
  const [negara, setNegara] = useState("");
  const [jenis, setJenis] = useState("");
  const [urut, setUrut] = useState("terbaru");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [, startTransition] = useTransition();

  const fetchDatabase = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cari) params.set("cari", cari);
      if (negara && negara !== "Semua Negara") params.set("negara", negara);
      if (jenis) params.set("jenis", jenis);
      if (urut) params.set("urut", urut);
      params.set("page", String(page));
      params.set("limit", "5");

      const res = await fetch(`/api/database-loker?${params.toString()}`);
      const json = await res.json();
      if (json.ok) {
        setEntries(json.data);
        setTotalPages(json.totalPages);
        setTotalItems(json.total);
      }
    } catch (err) {
      console.error("Gagal memuat database loker:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, [page, negara, jenis, urut]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDatabase();
  };

  const handleReset = () => {
    setCari("");
    setNegara("");
    setJenis("");
    setUrut("terbaru");
    setPage(1);
  };

  const [exporting, setExporting] = useState(false);

  const handleExportPDF = async () => {
    if (entries.length === 0 || exporting) return;
    setExporting(true);
    try {
      await downloadDatabasePdf({
        entries,
        cari,
        negara,
        jenis,
        totalFiltered: totalItems,
      });
    } catch (err) {
      console.error("Gagal mengekspor PDF database loker:", err);
    } finally {
      setExporting(false);
    }
  };

  const isSevere = (flags: string[]) => {
    const severe = ["biaya", "paspor", "sensitif", "turis", "telegram"];
    return flags.some((f) => severe.some((s) => f.toLowerCase().includes(s)));
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

  return (
    <main id="konten" className="mx-auto w-full max-w-[1248px] px-4 py-6 sm:px-6 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h1 className="text-[28px] sm:text-4xl font-extrabold text-ink">
            Database Loker Terindikasi Penipuan
          </h1>
          <p className="mt-2 text-[15px] leading-normal text-muted sm:text-base">
            Daftar temuan lowongan kerja mencurigakan yang telah diverifikasi oleh Admin dan laporan terkonfirmasi masyarakat.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportPDF}
          disabled={exporting || entries.length === 0}
          className="btn btn-secondary btn-sm -ml-3 mt-2 w-fit !px-3 sm:ml-0 sm:mt-0"
          title="Unduh data dalam format PDF"
        >
          {exporting ? (
            <div className="spinner !h-3.5 !w-3.5 !border-navy !border-t-transparent" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{exporting ? "Membuat PDF..." : "Ekspor PDF"}</span>
        </button>
      </div>

      {/* Filter Card */}
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        aria-label="Filter database"
        className="card mt-6 p-4 sm:mt-8 sm:p-6"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Input Pencarian */}
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="cari" className="field-label text-[13px] text-muted">
              Cari database
            </label>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="cari"
                name="cari"
                type="search"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
                className="input !pl-11"
                placeholder="Posisi, perusahaan, atau ID"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Filter Negara Tujuan */}
          <div>
            <label htmlFor="negara" className="field-label text-[13px] text-muted">
              Negara penempatan
            </label>
            <div className="relative mt-2">
              <select
                id="negara"
                name="negara"
                value={negara}
                onChange={(e) => {
                  setNegara(e.target.value);
                  setPage(1);
                }}
                className="input appearance-none !pr-10"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c === "Semua Negara" ? "" : c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Filter Jenis Red Flag */}
          <div>
            <label htmlFor="jenis" className="field-label text-[13px] text-muted">
              Jenis red flag
            </label>
            <div className="relative mt-2">
              <select
                id="jenis"
                name="jenis"
                value={jenis}
                onChange={(e) => {
                  setJenis(e.target.value);
                  setPage(1);
                }}
                className="input appearance-none !pr-10"
              >
                <option value="">Semua jenis</option>
                {RED_FLAGS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Urutan */}
          <div>
            <label htmlFor="urut" className="field-label text-[13px] text-muted">
              Urutkan
            </label>
            <div className="relative mt-2">
              <select
                id="urut"
                name="urut"
                value={urut}
                onChange={(e) => {
                  setUrut(e.target.value);
                  setPage(1);
                }}
                className="input appearance-none !pr-10"
              >
                <option value="terbaru">Terbaru</option>
                <option value="terlama">Terlama</option>
                <option value="terbanyak">Paling sering dilaporkan</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <p className="text-[13px] text-muted">
            Menampilkan {entries.length} dari {totalItems} entri terverifikasi
          </p>
          {(cari || negara || jenis || urut !== "terbaru") && (
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost btn-xs text-navy"
            >
              Atur ulang filter
            </button>
          )}
        </div>
      </form>

      {/* Daftar Kartu */}
      {loading ? (
        <div className="my-16 flex flex-col items-center justify-center gap-3">
          <div className="spinner border-navy" />
          <p className="text-sm font-semibold text-muted">Sedang memuat...</p>
        </div>
      ) : entries.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {entries.map((item) => {
            const severe = isSevere(item.flags);
            const title = `${item.pos} – ${item.org}`;

            return (
              <li key={item.id}>
                <article
                  className="card grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 gap-y-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-x-6 sm:p-6 card-hover"
                  aria-labelledby={`t-${item.id}`}
                >
                  {/* Pratinjau poster diburamkan */}
                  <div className="db-thumb sm:row-span-3" aria-hidden="true">
                    <div className="db-thumb-in">
                      <b>LOWONGAN</b>
                      <span>{item.thumb}</span>
                      <span className="skeleton w-full mt-2" />
                      <span className="skeleton w-4/5" />
                      <span className="skeleton w-3/5" />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col gap-2 sm:col-start-2 sm:row-start-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <h3 id={`t-${item.id}`} className="text-lg font-bold leading-snug sm:text-xl text-ink">
                        {title}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-muted sm:text-sm">
                        <span className="font-mono">{item.id}</span>
                        <span aria-hidden="true">•</span>
                        <span>Diverifikasi {formatDateLabel(item.date)}</span>
                        {item.country && (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-navy">
                              <Globe className="h-3.5 w-3.5" />
                              {item.country}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="self-start">
                      {severe ? (
                        <span className="badge badge-bahaya">
                          <OctagonAlert className="h-4 w-4" aria-hidden="true" />
                          Bahaya
                        </span>
                      ) : (
                        <span className="badge badge-waspada">
                          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                          Waspada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Red flag chips */}
                  <ul
                    aria-label="Red flag"
                    className="col-span-2 flex flex-col items-start gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-2 sm:flex-row sm:flex-wrap"
                  >
                    {item.flags.map((flag, idx) => (
                      <li
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1 text-[13px] font-medium leading-5 text-ink"
                      >
                        <Flag className="h-3.5 w-3.5 shrink-0 text-bahaya" aria-hidden="true" />
                        <span>{flag}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer kartu: jumlah laporan */}
                  <div className="col-span-2 pt-2 border-t border-line/60 sm:col-span-1 sm:col-start-2 sm:row-start-3">
                    <p className="text-[13px] leading-normal text-muted font-medium">
                      Dilaporkan {item.reports} kali oleh pencari kerja
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card my-8 px-6 py-12 text-center">
          <SearchX className="mx-auto h-10 w-10 text-muted" aria-hidden="true" />
          <h3 className="mt-4 text-xl font-bold text-ink">Tidak ada entri yang cocok</h3>
          <p className="mx-auto mt-2 max-w-[360px] text-[15px] leading-normal text-muted">
            Ubah kata kunci pencarian, filter negara, atau rentang tanggal, lalu coba lagi.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary btn-sm mt-6"
          >
            Atur ulang filter
          </button>
        </div>
      )}

      {/* Paginasi */}
      {totalPages > 1 && (
        <nav
          id="paginasi"
          className="mt-8 flex items-center justify-center gap-1 sm:gap-2"
          aria-label="Halaman daftar"
        >
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
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
                pNum === page
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
            disabled={page === totalPages}
            className="btn btn-ghost btn-sm !px-3"
          >
            Berikutnya
          </button>
        </nav>
      )}
    </main>
  );
}

