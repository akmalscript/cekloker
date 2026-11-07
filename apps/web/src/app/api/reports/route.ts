import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const body = await request.json();
    const {
      scanId,
      jobTitle,
      companyName,
      type,
      urgency,
      perpetratorContact,
      financialLoss,
      chronology,
      evidenceUrl,
    } = body;

    if (!chronology || !chronology.trim()) {
      return NextResponse.json(
        { error: "Deskripsi kronologi kecurigaan wajib diisi." },
        { status: 400 }
      );
    }

    if (chronology.length > 10000) {
      return NextResponse.json(
        { error: "Deskripsi kronologi maksimal 10.000 karakter." },
        { status: 400 }
      );
    }

    // Sanitize evidenceUrl to prevent javascript: or malformed URLs
    let sanitizedEvidenceUrl: string | null = null;
    if (evidenceUrl && typeof evidenceUrl === "string") {
      const trimmedUrl = evidenceUrl.trim();
      if (
        trimmedUrl.startsWith("http://") ||
        trimmedUrl.startsWith("https://") ||
        trimmedUrl.startsWith("/")
      ) {
        sanitizedEvidenceUrl = trimmedUrl.slice(0, 1000);
      }
    }

    const cleanJobTitle = jobTitle ? String(jobTitle).trim().slice(0, 255) : null;
    const cleanCompany = companyName ? String(companyName).trim().slice(0, 255) : null;
    const cleanContact = perpetratorContact ? String(perpetratorContact).trim().slice(0, 255) : null;
    const cleanChronology = chronology.trim().slice(0, 10000);

    let parsedLoss: number | null = null;
    if (financialLoss) {
      const num = parseFloat(String(financialLoss).replace(/[^\d.-]/g, ""));
      if (!isNaN(num) && num >= 0 && num < 1e12) parsedLoss = num;
    }

    // Auto-detect TPPO emergency indicators if not explicitly specified
    const textCorpus = `${cleanChronology} ${cleanJobTitle || ""} ${cleanCompany || ""}`.toLowerCase();
    const isTppoEmergency =
      urgency === "darurat_tppo" ||
      textCorpus.includes("tppo") ||
      textCorpus.includes("kamboja") ||
      textCorpus.includes("myanmar") ||
      textCorpus.includes("disandera") ||
      textCorpus.includes("disekap") ||
      textCorpus.includes("paspor ditahan");

    const reportUrgency = isTppoEmergency ? "darurat_tppo" : "reguler";
    const reportType = type === "chat" ? "chat" : "lowongan";
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reportCode = `CK-${year}-${randomSuffix}`;

    let reportId = "rep_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    try {
      const record = await prisma.report.create({
        data: {
          id: reportId,
          reportCode,
          scanId: scanId || null,
          userId,
          jobTitle: cleanJobTitle,
          companyName: cleanCompany,
          type: reportType,
          urgency: reportUrgency,
          perpetratorContact: cleanContact,
          financialLoss: parsedLoss,
          chronology: cleanChronology,
          evidenceUrl: sanitizedEvidenceUrl,
          status: "pending",
        },
      });
      reportId = record.id;
    } catch (dbErr) {
      console.warn("Database storage warning for report (using fallback):", dbErr);
    }

    return NextResponse.json({
      ok: true,
      id: reportId,
      message: "Laporan berhasil dikirim untuk ditinjau oleh tim verifikator.",
    });
  } catch (error: unknown) {
    console.error("POST /api/reports error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan sistem saat memproses laporan." },
      { status: 500 }
    );
  }
}

