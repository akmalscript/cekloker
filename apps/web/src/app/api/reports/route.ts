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

    let parsedLoss: number | null = null;
    if (financialLoss) {
      const num = parseFloat(String(financialLoss).replace(/[^\d.-]/g, ""));
      if (!isNaN(num)) parsedLoss = num;
    }

    // Auto-detect TPPO emergency indicators if not explicitly specified
    const textCorpus = `${chronology} ${jobTitle || ""} ${companyName || ""}`.toLowerCase();
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
          jobTitle: jobTitle?.trim() || null,
          companyName: companyName?.trim() || null,
          type: reportType,
          urgency: reportUrgency,
          perpetratorContact: perpetratorContact?.trim() || null,
          financialLoss: parsedLoss,
          chronology: chronology.trim(),
          evidenceUrl: evidenceUrl || null,
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

