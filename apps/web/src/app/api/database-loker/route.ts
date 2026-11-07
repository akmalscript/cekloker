import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface DatabaseLokerEntry {
  id: string;
  pos: string;
  org: string;
  country?: string;
  flags: string[];
  thumb: string;
  reports: number;
  date: string; // YYYY-MM-DD
}

// Data awal terverifikasi (Verified Community Scam Directory)
const SEED_DATA: DatabaseLokerEntry[] = [
  {
    id: "DB-2026-0001",
    pos: "Customer Service Telemarketing",
    org: "Grand Dragon Technology (Fiktif)",
    country: "Kamboja",
    flags: ["Gaji tidak wajar", "Pindah ke Telegram", "Penahanan paspor", "Visa turis"],
    thumb: "CS KAMBOJA",
    reports: 34,
    date: "2026-11-06",
  },
  {
    id: "DB-2026-0002",
    pos: "Admin Online Data Entry",
    org: "Shwe Kokko Digital Park",
    country: "Myanmar",
    flags: ["Gaji tidak wajar", "Tanpa wawancara", "Pindah ke Telegram", "Penahanan paspor"],
    thumb: "DATA ENTRY",
    reports: 28,
    date: "2026-11-05",
  },
  {
    id: "DB-2026-0003",
    pos: "Staf Administrasi & Rekrutmen",
    org: "PT Cakra Solusi Nusantara (Catut Nama)",
    country: "Indonesia",
    flags: ["Biaya rekrutmen", "Minta data sensitif", "Identitas tidak jelas"],
    thumb: "STAF ADMIN",
    reports: 19,
    date: "2026-11-04",
  },
  {
    id: "DB-2026-0004",
    pos: "Marketing Executive Crypto",
    org: "Golden Triangle Special Zone",
    country: "Laos",
    flags: ["Gaji tidak wajar", "Janji tidak realistis", "Tautan mencurigakan", "Pindah ke Telegram"],
    thumb: "MARKETING",
    reports: 23,
    date: "2026-11-03",
  },
  {
    id: "DB-2026-0005",
    pos: "Operator Produksi Elektronik",
    org: "CV Prima Mandiri Sejahtera",
    country: "Indonesia",
    flags: ["Biaya seragam di muka", "Lokasi tidak jelas", "Proses tidak wajar"],
    thumb: "OPERATOR",
    reports: 14,
    date: "2026-11-02",
  },
  {
    id: "DB-2026-0006",
    pos: "Live Streamer & Content Specialist",
    org: "Bavet Entertainment Complex",
    country: "Kamboja",
    flags: ["Gaji fantastis USD", "Pindah ke Telegram", "Penahanan paspor"],
    thumb: "STREAMER",
    reports: 17,
    date: "2026-11-01",
  },
  {
    id: "DB-2026-0007",
    pos: "Admin Freelance Like & Subscribe",
    org: "TikTok Partner Task Media (Palsu)",
    country: "Indonesia",
    flags: ["Minta deposit di muka", "Grup Telegram tertutup", "Proses tidak wajar"],
    thumb: "PART TIME",
    reports: 42,
    date: "2026-10-31",
  },
  {
    id: "DB-2026-0008",
    pos: "IT Support & System Maintenance",
    org: "KK Garden Technology Center",
    country: "Myanmar",
    flags: ["Penahanan paspor", "Lokasi konflik perbatasan", "Pindah ke Telegram"],
    thumb: "IT SUPPORT",
    reports: 29,
    date: "2026-10-30",
  },
  {
    id: "DB-2026-0009",
    pos: "Pekerja Pabrik Pengemasan",
    org: "PT Karya Abadi Logistik",
    country: "Indonesia",
    flags: ["Biaya tes medis di muka", "Identitas tidak jelas", "Minta transfer segera"],
    thumb: "PACKING",
    reports: 11,
    date: "2026-10-29",
  },
  {
    id: "DB-2026-0010",
    pos: "Customer Support Bahasa Indonesia",
    org: "Sihanoukville International Tower",
    country: "Kamboja",
    flags: ["Gaji tidak wajar", "Tiket ditalangi agen", "Visa turis", "Penahanan paspor"],
    thumb: "CS BAHASA",
    reports: 38,
    date: "2026-10-28",
  },
  {
    id: "DB-2026-0011",
    pos: "Admin Marketplace Shopee/Tokopedia",
    org: "CV Sumber Berkah Niaga (Catut Logo)",
    country: "Indonesia",
    flags: ["Minta foto KTP & Buku Tabungan", "Biaya materai/administrasi", "Kontak pribadi"],
    thumb: "MARKETPLACE",
    reports: 16,
    date: "2026-10-27",
  },
  {
    id: "DB-2026-0012",
    pos: "VIP Host & Chat Operator",
    org: "Clark Global Gaming Hub",
    country: "Filipina",
    flags: ["Pindah ke Telegram", "Bonus tidak realistis", "Tautan mencurigakan"],
    thumb: "VIP HOST",
    reports: 13,
    date: "2026-10-25",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("cari") || "").trim().toLowerCase();
    const negara = (searchParams.get("negara") || "").trim().toLowerCase();
    const jenis = (searchParams.get("jenis") || "").trim().toLowerCase();
    const from = searchParams.get("dari") || "";
    const to = searchParams.get("sampai") || "";
    const sort = searchParams.get("urut") || "terbaru";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "5"));

    let entries: DatabaseLokerEntry[] = [...SEED_DATA];

    // Ambil dari database Prisma jika ada
    try {
      const dbScams = await prisma.verifiedScam.findMany({
        orderBy: { verifiedAt: "desc" },
      });
      if (dbScams.length > 0) {
        const fromDb: DatabaseLokerEntry[] = dbScams.map((s) => ({
          id: s.code,
          pos: s.jobTitle,
          org: s.companyName,
          country: s.destination ?? "Tidak disebutkan",
          flags: s.redFlags,
          thumb: s.jobTitle.toUpperCase().slice(0, 10).trim(),
          reports: s.reportCount,
          date: s.verifiedAt.toISOString().slice(0, 10),
        }));
        // Gabungkan entri dari DB di awal
        entries = [...fromDb, ...SEED_DATA];
      }
    } catch (err) {
      console.warn("Prisma verifiedScam read fallback:", err);
    }

    // Filter
    const filtered = entries.filter((e) => {
      if (q) {
        const text = `${e.pos} ${e.org} ${e.id} ${e.country || ""}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      if (negara && e.country?.toLowerCase() !== negara) {
        return false;
      }
      if (jenis) {
        const hasFlag = e.flags.some((f) => f.toLowerCase().includes(jenis));
        if (!hasFlag) return false;
      }
      if (from && e.date < from) return false;
      if (to && e.date > to) return false;
      return true;
    });

    // Urutkan
    filtered.sort((a, b) => {
      if (sort === "terlama") return a.date.localeCompare(b.date);
      if (sort === "terbanyak") return b.reports - a.reports || b.date.localeCompare(a.date);
      return b.date.localeCompare(a.date); // default: terbaru
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      ok: true,
      data: paginated,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error: unknown) {
    console.error("GET /api/database-loker error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data basis data loker." },
      { status: 500 }
    );
  }
}

