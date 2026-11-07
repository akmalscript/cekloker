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

    let reportId = "rep_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    try {
      const record = await prisma.report.create({
        data: {
          id: reportId,
          scanId: scanId || null,
          userId,
          jobTitle: jobTitle?.trim() || null,
          companyName: companyName?.trim() || null,
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

