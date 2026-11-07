import type { AnalysisResult } from "@/types";

export interface StoredScan {
  id: string;
  guestId?: string;
  userId?: string;
  createdAt: number;
  expiresAt: number; // 24 jam untuk tamu
  imageUrl?: string;
  result: AnalysisResult;
  officialCheck: {
    found: boolean;
    p3miName?: string;
    sip2miCode?: string;
    detail: string;
    link: string;
  };
  scamMatches: number;
}

// In-memory store global untuk sesi dev / runtime
const scansMap = new Map<string, StoredScan>();

export async function saveScan(scan: StoredScan): Promise<void> {
  // Pruning scan tamu yang sudah lewat masa berlaku 24 jam
  const now = Date.now();
  for (const [key, item] of scansMap.entries()) {
    if (item.expiresAt < now) {
      scansMap.delete(key);
    }
  }

  scansMap.set(scan.id, scan);
}

export async function getScan(id: string): Promise<StoredScan | null> {
  const scan = scansMap.get(id);
  if (!scan) return null;

  // Cek apakah sudah kedaluwarsa
  if (scan.expiresAt < Date.now()) {
    scansMap.delete(id);
    return null;
  }

  return scan;
}

