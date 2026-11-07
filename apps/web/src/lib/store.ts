import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/types";
import type { Prisma } from "@prisma/client";

export interface StoredScan {
  id: string;
  guestId?: string;
  userId?: string;
  createdAt: number;
  expiresAt: number | null; // 24 jam untuk tamu, null untuk user terdaftar (permanen)
  imageUrl?: string;
  result: AnalysisResult;
  officialCheck: {
    found: boolean;
    p3miName?: string;
    sip2miCode?: string;
    licenseStatus?: string;
    countries?: string[];
    jobTypes?: string[];
    isExact?: boolean;
    similarityScore?: number;
    detail: string;
    link: string;
    mandatoryDisclaimer?: string;
  };
  scamMatches: number;
  scamDetails?: unknown;
}

// In-memory store global untuk sesi dev / runtime fallback
const scansMap = new Map<string, StoredScan>();

function inferPrimaryRedFlag(flags: AnalysisResult["red_flags"]): string | null {
  if (!flags || flags.length === 0) return null;
  const code = flags[0].code.toLowerCase();
  if (code.includes("salary") || code.includes("gaji") || code.includes("unrealistic")) return "gaji";
  if (code.includes("fee") || code.includes("biaya") || code.includes("upfront")) return "biaya";
  if (code.includes("telegram") || code.includes("whatsapp")) return "telegram";
  if (code.includes("passport") || code.includes("paspor") || code.includes("withhold")) return "paspor";
  if (code.includes("data") || code.includes("identity") || code.includes("personal")) return "data";
  return "gaji";
}

export async function saveScan(scan: StoredScan): Promise<void> {
  const now = Date.now();
  // Pruning memori lokal untuk tamu kedaluwarsa
  for (const [key, item] of scansMap.entries()) {
    if (item.expiresAt && item.expiresAt < now) {
      scansMap.delete(key);
    }
  }
  scansMap.set(scan.id, scan);

  try {
    const jobTitle = scan.result.extracted?.position?.trim() || "Lowongan Tanpa Judul";
    const company = scan.result.extracted?.company?.trim() || "Tidak tersedia";
    const primaryFlag = inferPrimaryRedFlag(scan.result.red_flags);

    await prisma.jobScan.upsert({
      where: { id: scan.id },
      create: {
        id: scan.id,
        userId: scan.userId ?? null,
        guestSessionId: scan.guestId ?? null,
        title: jobTitle,
        companyName: company,
        type: "lowongan",
        riskLevel: scan.result.risk_level,
        confidence: Math.round(scan.result.confidence * 100),
        redFlagCount: scan.result.red_flags.length,
        primaryRedFlag: primaryFlag,
        imageUrl: scan.imageUrl ?? null,
        resultJson: scan.result as unknown as Prisma.InputJsonValue,
        officialCheck: scan.officialCheck as unknown as Prisma.InputJsonValue,
        scamMatches: scan.scamMatches,
        scamDetails: (scan.scamDetails ?? null) as unknown as Prisma.InputJsonValue,
        createdAt: new Date(scan.createdAt),
        expiresAt: scan.expiresAt ? new Date(scan.expiresAt) : null,
      },
      update: {
        userId: scan.userId ?? undefined,
        guestSessionId: scan.guestId ?? undefined,
        expiresAt: scan.expiresAt ? new Date(scan.expiresAt) : null,
      },
    });
  } catch (err) {
    // Tetap berjalan dengan cache memori jika PostgreSQL belum terhubung di dev lokal
    console.warn("Database storage warning (using in-memory fallback):", err);
  }
}

export async function getScan(id: string): Promise<StoredScan | null> {
  // Coba ambil dari database
  try {
    const r = await prisma.jobScan.findUnique({
      where: { id },
    });
    if (r) {
      // Cek kedaluwarsa jika data tamu
      if (r.expiresAt && r.expiresAt.getTime() < Date.now()) {
        await prisma.jobScan.delete({ where: { id } }).catch(() => {});
        return null;
      }
      return {
        id: r.id,
        guestId: r.guestSessionId ?? undefined,
        userId: r.userId ?? undefined,
        createdAt: r.createdAt.getTime(),
        expiresAt: r.expiresAt ? r.expiresAt.getTime() : null,
        imageUrl: r.imageUrl ?? undefined,
        result: r.resultJson as unknown as AnalysisResult,
        officialCheck: (r.officialCheck as unknown as StoredScan["officialCheck"]) ?? {
          found: false,
          detail: "Data pengecekan resmi tidak tersedia.",
          link: "https://siskop2mi.bp2mi.go.id/",
        },
        scamMatches: r.scamMatches ?? 0,
        scamDetails: (r.scamDetails as unknown) ?? undefined,
      };
    }
  } catch (err) {
    console.warn("Database getScan warning (falling back to memory):", err);
  }

  const scan = scansMap.get(id);
  if (!scan) return null;

  if (scan.expiresAt && scan.expiresAt < Date.now()) {
    scansMap.delete(id);
    return null;
  }

  return scan;
}

export async function claimGuestScans(guestSessionId: string, userId: string): Promise<number> {
  let count = 0;
  try {
    const res = await prisma.jobScan.updateMany({
      where: {
        guestSessionId,
        userId: null,
      },
      data: {
        userId,
        expiresAt: null, // Berubah menjadi permanen untuk akun terdaftar
      },
    });
    count = res.count;
  } catch (err) {
    console.warn("Database claimGuestScans warning (using memory fallback):", err);
  }

  // Update juga di cache in-memory
  for (const [_, item] of scansMap.entries()) {
    if (item.guestId === guestSessionId && !item.userId) {
      item.userId = userId;
      item.expiresAt = null;
      count++;
    }
  }

  return count;
}

export async function getUserScans(userId: string): Promise<StoredScan[]> {
  try {
    const records = await prisma.jobScan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (records.length > 0) {
      return records.map((r) => ({
        id: r.id,
        guestId: r.guestSessionId ?? undefined,
        userId: r.userId ?? undefined,
        createdAt: r.createdAt.getTime(),
        expiresAt: r.expiresAt ? r.expiresAt.getTime() : null,
        imageUrl: r.imageUrl ?? undefined,
        result: r.resultJson as unknown as AnalysisResult,
        officialCheck: (r.officialCheck as unknown as StoredScan["officialCheck"]) ?? {
          found: false,
          detail: "Data verifikasi resmi tidak tersedia.",
          link: "https://siskop2mi.bp2mi.go.id/",
        },
        scamMatches: r.scamMatches ?? 0,
        scamDetails: (r.scamDetails as unknown) ?? undefined,
      }));
    }
  } catch (err) {
    console.warn("Database getUserScans warning (using memory fallback):", err);
  }

  const list: StoredScan[] = [];
  for (const item of scansMap.values()) {
    if (item.userId === userId) {
      list.push(item);
    }
  }
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteScan(scanId: string, userId: string): Promise<boolean> {
  let deleted = false;
  try {
    const res = await prisma.jobScan.deleteMany({
      where: {
        id: scanId,
        userId,
      },
    });
    if (res.count > 0) deleted = true;
  } catch (err) {
    console.warn("Database deleteScan warning:", err);
  }

  if (scansMap.has(scanId)) {
    const item = scansMap.get(scanId);
    if (item && item.userId === userId) {
      scansMap.delete(scanId);
      deleted = true;
    }
  }

  return deleted;
}

export async function deleteAllUserScans(userId: string): Promise<number> {
  let count = 0;
  try {
    const res = await prisma.jobScan.deleteMany({
      where: { userId },
    });
    count = res.count;
  } catch (err) {
    console.warn("Database deleteAllUserScans warning:", err);
  }

  for (const [key, item] of scansMap.entries()) {
    if (item.userId === userId) {
      scansMap.delete(key);
      count++;
    }
  }

  return count;
}
