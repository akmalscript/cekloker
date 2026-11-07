import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerScamPoster } from "@/lib/matching/poster-matcher";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { decision, notes, isAnonymous, destination, redFlags } = body;

    if (!decision || (decision !== "approve" && decision !== "terima" && decision !== "reject" && decision !== "tolak")) {
      return NextResponse.json(
        { error: "Keputusan tidak valid. Pilih 'terima' atau 'tolak'." },
        { status: 400 }
      );
    }

    const isApprove = decision === "approve" || decision === "terima";
    const status = isApprove ? "approved" : "rejected";

    let report = null;
    try {
      report = await prisma.report.findFirst({
        where: {
          OR: [{ id }, { reportCode: id }],
        },
        include: { scan: true },
      });

      if (report) {
        // Update report in database
        await prisma.report.update({
          where: { id: report.id },
          data: {
            status,
            adminNotes: notes ? String(notes).trim() : null,
            reviewedBy: session.user.email || session.user.name || "Admin CekLoker",
            reviewedAt: new Date(),
            isAnonymous: Boolean(isAnonymous),
          },
        });

        // If approved, publish to VerifiedScam database
        if (isApprove) {
          const year = new Date().getFullYear();
          const randomCode = `DB-${year}-${Math.floor(1000 + Math.random() * 9000)}`;

          // Extract redFlags from scan if available
          let extractedTags: string[] = Array.isArray(redFlags) && redFlags.length > 0 ? redFlags : [];
          if (extractedTags.length === 0 && report.scan?.resultJson) {
            const json: any = report.scan.resultJson;
            if (Array.isArray(json.flags)) {
              extractedTags = json.flags.map((f: any) => f.label || f.code);
            }
          }
          if (extractedTags.length === 0) {
            extractedTags = [
              report.urgency === "darurat_tppo" ? "Penyekapan / TPPO" : "Pungutan Biaya",
              "Rekrutmen Non-Resmi",
            ];
          }

          // Extract pHash if available
          let imagePhash: string | null = null;
          let candidatePhashes: string[] = [];
          if (report.scan?.resultJson) {
            const json: any = report.scan.resultJson;
            if (Array.isArray(json.fingerprint?.image_phash)) {
              candidatePhashes = json.fingerprint.image_phash.filter((h: any) => typeof h === "string");
              if (candidatePhashes.length > 0) {
                imagePhash = candidatePhashes[0];
              }
            } else if (typeof json.fingerprint?.image_phash === "string") {
              imagePhash = json.fingerprint.image_phash;
              candidatePhashes = [imagePhash];
            }
          }
          if (!imagePhash) {
            imagePhash = "phash_" + Math.random().toString(16).slice(2, 18);
          }

          const targetDestination =
            destination?.trim() ||
            (report.urgency === "darurat_tppo" ? "Kamboja / Myanmar" : "Indonesia");

          const verifiedScamRecord = await prisma.verifiedScam.create({
            data: {
              code: randomCode,
              jobTitle: report.jobTitle || "Lowongan Terindikasi Penipuan",
              companyName: report.companyName || "Perusahaan Anonim / Fiktif",
              destination: targetDestination,
              redFlags: extractedTags,
              reportCount: 1,
              imagePhash,
              verifiedAt: new Date(),
            },
          });

          // Simpan poster penipuan ke ScamPoster untuk pencocokan visual dHash 64-bit (FR-PST-01 s/d 03)
          for (const ph of candidatePhashes) {
            if (/^[0-9a-fA-F]{16}$/.test(ph)) {
              await registerScamPoster({
                imagePhash: ph.toLowerCase(),
                jobTitle: report.jobTitle || "Lowongan Terindikasi Penipuan",
                companyName: report.companyName || "Perusahaan Anonim / Fiktif",
                destination: targetDestination,
                reportCount: 1,
                sourceReportId: report.id,
                verifiedScamId: verifiedScamRecord.id,
              }).catch((e) => console.warn("Failed registering scam poster:", e));
            }
          }
        }
      }
    } catch (dbErr) {
      console.warn("DB operation fallback in decision:", dbErr);
    }

    return NextResponse.json({
      ok: true,
      decision: isApprove ? "approved" : "rejected",
      message: isApprove
        ? "Laporan berhasil disetujui dan dimasukkan ke Database Loker Dilaporkan."
        : "Laporan berhasil ditolak. Catatan admin tersimpan untuk arsip internal.",
    });
  } catch (error: unknown) {
    console.error("POST /api/admin/reports/[id]/decision error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
