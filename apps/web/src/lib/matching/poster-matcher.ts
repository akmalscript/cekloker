import { prisma } from "@/lib/prisma";
import {
  calculateHammingDistance,
  calculateSimilarityPercentage,
  HAMMING_DISTANCE_MATCH_THRESHOLD,
} from "@/lib/image/phash";

export interface ScamPosterItem {
  id: string;
  imagePhash: string;
  jobTitle?: string | null;
  companyName?: string | null;
  destination?: string | null;
  reportCount: number;
  sourceReportId?: string | null;
  verifiedScamId?: string | null;
}

export interface ScamPosterMatch {
  posterId: string;
  imagePhash: string;
  jobTitle: string;
  companyName: string;
  destination: string;
  reportCount: number;
  distance: number;
  similarityPercent: number;
}

export interface PosterMatchResult {
  matched: boolean;
  matchedCount: number;
  bestDistance: number | null;
  bestSimilarity: number | null;
  findingLabel: string | null;
  matches: ScamPosterMatch[];
}

// Basis data benih awal poster penipuan yang telah terverifikasi moderator (Fase 6 / Evaluasi)
export const INITIAL_SCAM_POSTERS: ScamPosterItem[] = [
  {
    id: "sp_kamboja_cs_01",
    imagePhash: "f0e1d2c3b4a59687",
    jobTitle: "Customer Service Online Phnom Penh",
    companyName: "Anonim / Sindikat Penipuan Daring Kamboja",
    destination: "Phnom Penh, Kamboja",
    reportCount: 4,
    sourceReportId: "CK-2026-0042",
    verifiedScamId: "DB-2026-0001",
  },
  {
    id: "sp_taiwan_pabrik_01",
    imagePhash: "abcdef1234567890",
    jobTitle: "Operator Pabrik Elektronik Taiwan",
    companyName: "PT Taiwan Mandiri Jaya (Pungutan Biaya Di Muka)",
    destination: "Taichung, Taiwan",
    reportCount: 1,
    sourceReportId: "CK-2026-0089",
    verifiedScamId: "DB-2026-0002",
  },
  {
    id: "sp_myanmar_chat_01",
    imagePhash: "a1b2c3d4e5f60718",
    jobTitle: "Data Entry & Admin Chatting Luar Negeri",
    companyName: "Global Golden Tech Cyber",
    destination: "Myawaddy, Myanmar",
    reportCount: 3,
    sourceReportId: "CK-2026-0105",
    verifiedScamId: "DB-2026-0003",
  },
  {
    id: "sp_filipina_gaming_01",
    imagePhash: "1122334455667788",
    jobTitle: "Telemarketing & Customer Support Online",
    companyName: "Lucky Horizon International",
    destination: "Manila, Filipina",
    reportCount: 2,
    sourceReportId: "CK-2026-0112",
    verifiedScamId: "DB-2026-0004",
  },
];

// In-memory cache untuk fallback jika PostgreSQL lokal offline
const memoryScamPosters = new Map<string, ScamPosterItem>(
  INITIAL_SCAM_POSTERS.map((item) => [item.id, item])
);

/**
 * Mengambil daftar seluruh poster penipuan terverifikasi dari database,
 * digabungkan dengan seed awal jika database kosong/offline.
 */
export async function getAllScamPosters(): Promise<ScamPosterItem[]> {
  if (!process.env.DATABASE_URL) {
    return Array.from(memoryScamPosters.values());
  }

  try {
    const dbPosters = await prisma.scamPoster.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (dbPosters && dbPosters.length > 0) {
      // Gabungkan data DB dan pastikan seed awal tidak terduplikasi
      const map = new Map<string, ScamPosterItem>();
      for (const sp of INITIAL_SCAM_POSTERS) {
        map.set(sp.imagePhash.toLowerCase(), sp);
      }
      for (const p of dbPosters) {
        map.set(p.imagePhash.toLowerCase(), {
          id: p.id,
          imagePhash: p.imagePhash.toLowerCase(),
          jobTitle: p.jobTitle,
          companyName: p.companyName,
          destination: p.destination,
          reportCount: p.reportCount,
          sourceReportId: p.sourceReportId,
          verifiedScamId: p.verifiedScamId,
        });
      }
      return Array.from(map.values());
    }
  } catch (err) {
    console.warn("getAllScamPosters db warning, using memory seed:", err);
  }

  return Array.from(memoryScamPosters.values());
}

/**
 * Mencocokkan satu atau banyak image_phash terhadap basis data poster penipuan (FR-PST-01 s/d FR-PST-03).
 * Menghitung Hamming Distance. Jika selisih bit <= 10, dinyatakan cocok (kemiripan tinggi).
 */
export async function matchScamPosters(
  hashes: string[],
  threshold = HAMMING_DISTANCE_MATCH_THRESHOLD
): Promise<PosterMatchResult> {
  const validHashes = hashes
    .map((h) => h?.trim().toLowerCase())
    .filter((h) => /^[0-9a-f]{16}$/.test(h));

  if (validHashes.length === 0) {
    return {
      matched: false,
      matchedCount: 0,
      bestDistance: null,
      bestSimilarity: null,
      findingLabel: null,
      matches: [],
    };
  }

  const allScamPosters = await getAllScamPosters();
  const matchedMap = new Map<string, ScamPosterMatch>();

  for (const inputHash of validHashes) {
    for (const scamPoster of allScamPosters) {
      try {
        const distance = calculateHammingDistance(inputHash, scamPoster.imagePhash);

        if (distance <= threshold) {
          const similarityPercent = calculateSimilarityPercentage(distance);
          const existing = matchedMap.get(scamPoster.id);

          if (!existing || distance < existing.distance) {
            matchedMap.set(scamPoster.id, {
              posterId: scamPoster.id,
              imagePhash: scamPoster.imagePhash,
              jobTitle: scamPoster.jobTitle || "Lowongan Terindikasi Penipuan",
              companyName: scamPoster.companyName || "Anonim / Tidak Terdaftar",
              destination: scamPoster.destination || "Luar Negeri",
              reportCount: scamPoster.reportCount || 1,
              distance,
              similarityPercent,
            });
          }
        }
      } catch {
        // Abaikan hash tidak valid
      }
    }
  }

  const matches = Array.from(matchedMap.values()).sort((a, b) => a.distance - b.distance);
  const matched = matches.length > 0;

  // Hitung akumulasi total laporan terverifikasi yang cocok
  const totalReportsCount = matches.reduce((acc, m) => acc + (m.reportCount || 1), 0);
  const bestDistance = matches.length > 0 ? matches[0].distance : null;
  const bestSimilarity = matches.length > 0 ? matches[0].similarityPercent : null;

  const findingLabel = matched
    ? `Cocok dengan ${totalReportsCount} laporan penipuan terverifikasi`
    : null;

  return {
    matched,
    matchedCount: totalReportsCount,
    bestDistance,
    bestSimilarity,
    findingLabel,
    matches,
  };
}

/**
 * Menyimpan poster penipuan baru dari laporan yang disetujui moderator (Fase 6).
 */
export async function registerScamPoster(data: {
  imagePhash: string;
  jobTitle?: string;
  companyName?: string;
  destination?: string;
  reportCount?: number;
  sourceReportId?: string;
  verifiedScamId?: string;
}): Promise<ScamPosterItem> {
  const cleanHash = data.imagePhash.trim().toLowerCase();
  const count = data.reportCount ?? 1;

  try {
    const existing = await prisma.scamPoster.findFirst({
      where: { imagePhash: cleanHash },
    });

    if (existing) {
      const updated = await prisma.scamPoster.update({
        where: { id: existing.id },
        data: {
          reportCount: existing.reportCount + count,
          jobTitle: data.jobTitle || existing.jobTitle,
          companyName: data.companyName || existing.companyName,
          destination: data.destination || existing.destination,
          sourceReportId: data.sourceReportId || existing.sourceReportId,
          verifiedScamId: data.verifiedScamId || existing.verifiedScamId,
        },
      });
      return updated;
    }

    const created = await prisma.scamPoster.create({
      data: {
        imagePhash: cleanHash,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        destination: data.destination,
        reportCount: count,
        sourceReportId: data.sourceReportId,
        verifiedScamId: data.verifiedScamId,
      },
    });
    return created;
  } catch (err) {
    console.warn("registerScamPoster db error, updating memory store:", err);
  }

  // Fallback in-memory
  const id = "sp_" + Math.random().toString(36).slice(2, 10);
  const item: ScamPosterItem = {
    id,
    imagePhash: cleanHash,
    jobTitle: data.jobTitle,
    companyName: data.companyName,
    destination: data.destination,
    reportCount: count,
    sourceReportId: data.sourceReportId,
    verifiedScamId: data.verifiedScamId,
  };
  memoryScamPosters.set(id, item);
  return item;
}
