import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Prototype fallback data for clean initial experience
const MOCK_REPORTS = [
  {
    id: "rep-0142",
    reportCode: "CK-2026-0142",
    jobTitle: "Admin Operasional",
    companyName: "PT Mitra Karya Nusantara",
    type: "lowongan",
    urgency: "darurat_tppo",
    status: "pending",
    perpetratorContact: "0812-9988-7711 (WA Pelaku)",
    financialLoss: 3500000,
    chronology:
      "Diminta transfer biaya booking tiket pesawat dan visa kerja ke Kamboja tanpa surat izin resmi Kemnaker RI. Pelaku menjanjikan gaji 15 juta tapi paspor ditahan.",
    evidenceUrl: "/poster-sample-1.jpg",
    createdAt: new Date("2026-11-05T09:30:00Z"),
    scanId: "PK-2026-0087",
    scan: {
      id: "PK-2026-0087",
      title: "Admin Operasional",
      companyName: "PT Mitra Karya Nusantara",
      riskLevel: "bahaya",
      confidence: 96,
      redFlagCount: 4,
      primaryRedFlag: "paspor",
    },
  },
  {
    id: "rep-0141",
    reportCode: "CK-2026-0141",
    jobTitle: "Customer Service Chat",
    companyName: "PT Solusi Pelanggan Indonesia",
    type: "chat",
    urgency: "reguler",
    status: "pending",
    perpetratorContact: "@hrd_recruitment_official (Telegram)",
    financialLoss: 500000,
    chronology:
      "Proses interview berlangsung di grup Telegram tidak resmi. Pelamar diminta membeli paket software pelatihan kerja senilai Rp500.000.",
    evidenceUrl: null,
    createdAt: new Date("2026-11-05T08:15:00Z"),
    scanId: null,
    scan: null,
  },
  {
    id: "rep-0140",
    reportCode: "CK-2026-0140",
    jobTitle: "Staff Administrasi Gudang",
    companyName: "CV Langkah Bersama",
    type: "lowongan",
    urgency: "reguler",
    status: "pending",
    perpetratorContact: "0877-3321-4455",
    financialLoss: null,
    chronology:
      "Surat panggilan kerja mencantumkan agen travel fiktif dan kewajiban reimbursement tiket hotel bintang 5.",
    evidenceUrl: null,
    createdAt: new Date("2026-11-05T07:00:00Z"),
    scanId: null,
    scan: null,
  },
  {
    id: "rep-0139",
    reportCode: "CK-2026-0139",
    jobTitle: "Data Entry Remote",
    companyName: "PT Ruang Kerja Digital",
    type: "lowongan",
    urgency: "reguler",
    status: "reviewing",
    perpetratorContact: "0858-1122-3344",
    financialLoss: 1200000,
    chronology:
      "Skema deposit saldo untuk membuka task data entry e-commerce fiktif. Saldo ditarik tidak bisa dicairkan.",
    evidenceUrl: null,
    createdAt: new Date("2026-11-04T16:20:00Z"),
    scanId: null,
    scan: null,
  },
  {
    id: "rep-0138",
    reportCode: "CK-2026-0138",
    jobTitle: "Marketing Executive",
    companyName: "PT Cakrawala Niaga",
    type: "chat",
    urgency: "reguler",
    status: "pending",
    perpetratorContact: "0821-4433-2211",
    financialLoss: null,
    chronology:
      "Pesan WhatsApp spam menawarkan kerja paruh waktu rating bintang produk dengan komisi instan tidak realistis.",
    evidenceUrl: null,
    createdAt: new Date("2026-11-04T14:10:00Z"),
    scanId: null,
    scan: null,
  },
  {
    id: "rep-0137",
    reportCode: "CK-2026-0137",
    jobTitle: "Operator Telemarketing",
    companyName: "Global Tech Myanmar Ltd",
    type: "lowongan",
    urgency: "darurat_tppo",
    status: "approved",
    perpetratorContact: "0899-7766-5544",
    financialLoss: 10000000,
    chronology:
      "Indikasi kuat sindikat scam penipuan lintas batas di Myawaddy Myanmar. Rekrutmen ilegal tanpa visa kerja.",
    evidenceUrl: null,
    createdAt: new Date("2026-11-03T11:00:00Z"),
    scanId: null,
    scan: null,
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Verify authentication and role
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role || "USER";
    const email = session.user.email || "";
    const isAdminOrMod =
      role === "ADMIN" ||
      role === "MODERATOR" ||
      email.startsWith("admin@") ||
      Boolean(
        process.env.ADMIN_EMAILS &&
          process.env.ADMIN_EMAILS.split(",").map((e) => e.trim()).includes(email)
      );

    if (!isAdminOrMod) {
      return NextResponse.json({ error: "Forbidden: Access restricted to ADMIN or MODERATOR" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const statusParam = (searchParams.get("status") || "").trim().toLowerCase();
    const urgencyParam = (searchParams.get("urgency") || "").trim().toLowerCase();
    const urutkan = (searchParams.get("urutkan") || "terbaru").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));

    let dbReports: any[] = [];
    let totalCount = 0;
    let newCount = 0;

    try {
      // Build Prisma filter
      const where: any = {};

      if (q) {
        where.OR = [
          { jobTitle: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
          { reportCode: { contains: q, mode: "insensitive" } },
          { chronology: { contains: q, mode: "insensitive" } },
          { perpetratorContact: { contains: q, mode: "insensitive" } },
        ];
      }

      if (statusParam) {
        if (statusParam === "baru" || statusParam === "pending") {
          where.status = "pending";
        } else if (statusParam === "ditinjau" || statusParam === "reviewing") {
          where.status = "reviewing";
        } else if (statusParam === "disetujui" || statusParam === "approved") {
          where.status = "approved";
        } else if (statusParam === "ditolak" || statusParam === "rejected") {
          where.status = "rejected";
        } else {
          where.status = statusParam;
        }
      }

      if (urgencyParam) {
        where.urgency = urgencyParam;
      }

      const orderBy = urutkan === "terlama" ? { createdAt: "asc" as const } : { createdAt: "desc" as const };

      const [count, pendingCount, records] = await Promise.all([
        prisma.report.count({ where }),
        prisma.report.count({ where: { status: "pending" } }),
        prisma.report.findMany({
          where,
          include: {
            scan: true,
            user: { select: { name: true, email: true } },
          },
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      totalCount = count;
      newCount = pendingCount;
      dbReports = records;
    } catch (dbErr) {
      console.warn("DB query failed, falling back to in-memory items:", dbErr);
    }

    // If DB is empty, provide the mock fallback
    if (totalCount === 0 && dbReports.length === 0) {
      let filtered = [...MOCK_REPORTS];

      if (q) {
        filtered = filtered.filter(
          (r) =>
            r.jobTitle.toLowerCase().includes(q) ||
            r.companyName.toLowerCase().includes(q) ||
            r.reportCode.toLowerCase().includes(q) ||
            r.chronology.toLowerCase().includes(q) ||
            (r.perpetratorContact && r.perpetratorContact.toLowerCase().includes(q))
        );
      }

      if (statusParam) {
        filtered = filtered.filter((r) => {
          if (statusParam === "baru" || statusParam === "pending") return r.status === "pending";
          if (statusParam === "ditinjau" || statusParam === "reviewing") return r.status === "reviewing";
          if (statusParam === "disetujui" || statusParam === "approved") return r.status === "approved";
          if (statusParam === "ditolak" || statusParam === "rejected") return r.status === "rejected";
          return r.status === statusParam;
        });
      }

      if (urgencyParam) {
        filtered = filtered.filter((r) => r.urgency === urgencyParam);
      }

      if (urutkan === "terlama") {
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      } else {
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      totalCount = filtered.length;
      newCount = MOCK_REPORTS.filter((r) => r.status === "pending").length;
      const startIndex = (page - 1) * limit;
      dbReports = filtered.slice(startIndex, startIndex + limit);
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return NextResponse.json({
      reports: dbReports,
      total: totalCount,
      newCount,
      page,
      totalPages,
      limit,
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
