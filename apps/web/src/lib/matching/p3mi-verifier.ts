import { prisma } from "@/lib/prisma";

export interface OfficialP3MIItem {
  id: string;
  name: string;
  normalizedName: string;
  licenseNumber: string;
  status: string; // "Aktif" | "Kedaluwarsa" | "Dibekukan"
  countries: string[];
  jobTypes: string[];
  address?: string | null;
  contact?: string | null;
  officialUrl?: string | null;
}

export interface P3MIVerificationResult {
  found: boolean;
  p3miName?: string;
  sip2miCode?: string;
  licenseStatus?: string;
  countries?: string[];
  jobTypes?: string[];
  isExact: boolean;
  similarityScore: number;
  detail: string;
  link: string;
  mandatoryDisclaimer?: string;
}

/**
 * Teks disclaimer resmi wajib sesuai SRS FR-RSM-04 & AGENTS.md §4.
 */
export const MANDATORY_UNFOUND_DISCLAIMER =
  'Catatan penting: Status "tidak ditemukan" pada basis data resmi bukan bukti bahwa suatu perusahaan otomatis ilegal/kriminal, melainkan menunjukkan ketiadaan jaminan pelindungan hukum ketenagakerjaan resmi dari negara RI.';

export const OFFICIAL_SISKOP2MI_URL = "https://siskop2mi.bp2mi.go.id/";

// Basis data benih resmi P3MI terdaftar Kemnaker & SISKOP2MI BP2MI
export const SEED_OFFICIAL_P3MI: OfficialP3MIItem[] = [
  {
    id: "p3mi_os_selnajaya",
    name: "PT OS SELNAJAYA INDONESIA",
    normalizedName: "os selnajaya",
    licenseNumber: "SIP2MI-JPN-2026-0812",
    status: "Aktif",
    countries: ["Jepang"],
    jobTypes: ["Caregiver (Perawat Lansia)", "Manufaktur", "Pengolahan Makanan"],
    address: "Mid Plaza 1 Lt. 17, Jl. Jend. Sudirman Kav 10-11, Jakarta Pusat",
    contact: "021-570-6222 / info@os-selnajaya.com",
    officialUrl: "https://os-selnajaya.com",
  },
  {
    id: "p3mi_taiwan_mandiri",
    name: "PT TAIWAN MANDIRI JAYA",
    normalizedName: "taiwan mandiri jaya",
    licenseNumber: "SIP2MI-TWN-2025-0144",
    status: "Aktif",
    countries: ["Taiwan"],
    jobTypes: ["Operator Pabrik Elektronik", "Manufaktur Logam"],
    address: "Rukan Sentra Niaga Blok B-12, Jakarta Barat",
    contact: "021-583-0091",
    officialUrl: "https://taiwanmandirijaya.co.id",
  },
  {
    id: "p3mi_samudra_penempatan",
    name: "PT SAMUDRA PENEMPATAN INDONESIA",
    normalizedName: "samudra penempatan",
    licenseNumber: "SIP2MI-KOR-2025-0319",
    status: "Aktif",
    countries: ["Korea Selatan", "Jepang"],
    jobTypes: ["Perikanan Tangkap", "Konstruksi", "Welding"],
    address: "Jl. Pelabuhan Tanjung Priok No. 45, Jakarta Utara",
    contact: "021-439-0123",
    officialUrl: "https://samudra-penempatan.co.id",
  },
  {
    id: "p3mi_binawan",
    name: "PT BINAWAN INTI UTAMA",
    normalizedName: "binawan inti utama",
    licenseNumber: "SIP2MI-GLB-2024-0021",
    status: "Aktif",
    countries: ["Jerman", "Belanda", "Arab Saudi", "Uni Emirat Arab"],
    jobTypes: ["Tenaga Kesehatan (Perawat)", "Hospitality", "Teknisi"],
    address: "Jl. Kalibata Raya No. 25-30, Jakarta Timur",
    contact: "021-809-7777",
    officialUrl: "https://binawan.co.id",
  },
  {
    id: "p3mi_bali_paradise",
    name: "PT BALI PARADISE CITRA DEWATA",
    normalizedName: "bali paradise citra dewata",
    licenseNumber: "SIP2MI-CRU-2025-0452",
    status: "Aktif",
    countries: ["Amerika Serikat", "Italia", "Marseille (Kapal Pesiar)"],
    jobTypes: ["Cruiseline Staff", "F&B Service", "Hotel Operations"],
    address: "Jl. By Pass Ngurah Rai No. 88, Denpasar, Bali",
    contact: "0361-285-111",
    officialUrl: "https://baliparadise.com",
  },
  {
    id: "p3mi_amri_margatama",
    name: "PT AMRI MARGATAMA",
    normalizedName: "amri margatama",
    licenseNumber: "SIP2MI-MYS-2025-0551",
    status: "Aktif",
    countries: ["Malaysia", "Brunei Darussalam"],
    jobTypes: ["Perkebunan Kelapa Sawit", "Manufaktur Elektronik"],
    address: "Jl. Hayam Wuruk No. 108, Jakarta Barat",
    contact: "021-629-4455",
    officialUrl: "https://amrimargatama.com",
  },
];

// In-memory cache fallback jika PostgreSQL lokal offline
const memoryP3MIMap = new Map<string, OfficialP3MIItem>(
  SEED_OFFICIAL_P3MI.map((item) => [item.id, item])
);

/**
 * Normalisasi nama perusahaan:
 * Menghapus bentuk badan usaha (PT, CV, dll.), tanda baca, dan kata umum.
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return "";

  return name
    .toLowerCase()
    .replace(/\b(pt|p\.t|cv|c\.v|fa|ud|tbk|persero|inc|corp|corporation|ltd|limited|co)\b\.?/gi, " ")
    .replace(/\bindonesia\b/gi, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Menghitung Levenshtein Distance antara dua string.
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Menghitung kemiripan Trigram (N-gram 3 karakter) / Dice Coefficient.
 * Sangat tangguh mendeteksi salah ketik (typo), transposisi huruf, dan perbedaan spasi.
 */
export function calculateTrigramSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) {
    const lev = calculateLevenshteinDistance(a, b);
    return Math.max(0, 1 - lev / Math.max(a.length, b.length, 1));
  }

  const getTrigrams = (str: string): string[] => {
    const padded = `  ${str} `;
    const grams: string[] = [];
    for (let i = 0; i < padded.length - 2; i++) {
      grams.push(padded.slice(i, i + 3));
    }
    return grams;
  };

  const gramsA = getTrigrams(a);
  const gramsB = getTrigrams(b);

  const freqB = new Map<string, number>();
  for (const g of gramsB) {
    freqB.set(g, (freqB.get(g) || 0) + 1);
  }

  let matches = 0;
  for (const g of gramsA) {
    const count = freqB.get(g) || 0;
    if (count > 0) {
      matches++;
      freqB.set(g, count - 1);
    }
  }

  return (2.0 * matches) / (gramsA.length + gramsB.length);
}

/**
 * Menghitung kemiripan antara dua kata tunggal (token).
 */
export function calculateTokenSimilarity(w1: string, w2: string): number {
  if (w1 === w2) return 1.0;
  if (!w1 || !w2) return 0;

  const lev = calculateLevenshteinDistance(w1, w2);
  const maxLen = Math.max(w1.length, w2.length);

  // Jika typo hanya 1 karakter (misal 'tiwan' vs 'taiwan', 'selnajya' vs 'selnajaya')
  if (lev === 1 && maxLen >= 4) {
    return 0.9;
  }
  if (lev <= 2 && maxLen >= 6) {
    return 0.8;
  }

  const tri = calculateTrigramSimilarity(w1, w2);
  const levScore = Math.max(0, 1 - lev / maxLen);
  return Math.max(tri, levScore);
}

/**
 * Menghitung skor kemiripan komposit toleran salah ketik (Fuzzy Similarity).
 * Menggabungkan kecocokan subset token, Trigram similarity, dan Levenshtein distance.
 */
export function calculateFuzzySimilarity(query: string, target: string): number {
  const q = normalizeCompanyName(query);
  const t = normalizeCompanyName(target);

  if (!q || !t) return 0;
  if (q === t) return 1.0;

  // 1. Pencocokan berbasis token kata
  const qTokens = q.split(" ").filter((w) => w.length > 0);
  const tTokens = t.split(" ").filter((w) => w.length > 0);

  let tokenScoreSum = 0;
  for (const qWord of qTokens) {
    let bestWordMatch = 0;
    for (const tWord of tTokens) {
      const sim = calculateTokenSimilarity(qWord, tWord);
      if (sim > bestWordMatch) {
        bestWordMatch = sim;
      }
    }
    tokenScoreSum += bestWordMatch;
  }
  const avgTokenScore = qTokens.length > 0 ? tokenScoreSum / qTokens.length : 0;

  // 2. Trigram similarity seluruh string
  const trigramScore = calculateTrigramSimilarity(q, t);

  // 3. Levenshtein normalized seluruh string
  const maxLen = Math.max(q.length, t.length);
  const levDist = calculateLevenshteinDistance(q, t);
  const levScore = Math.max(0, 1 - levDist / maxLen);

  const stringScore = trigramScore * 0.65 + levScore * 0.35;

  // Skor komposit mengambil nilai terbaik antara token matching dan full string
  const finalScore = Math.max(avgTokenScore, stringScore);
  return Math.round(finalScore * 100) / 100;
}

/**
 * Mengambil daftar seluruh P3MI berizin dari database atau fallback seed.
 */
export async function getAllOfficialP3MI(): Promise<OfficialP3MIItem[]> {
  if (!process.env.DATABASE_URL) {
    return Array.from(memoryP3MIMap.values());
  }

  try {
    const dbItems = await prisma.officialP3MI.findMany();
    if (dbItems && dbItems.length > 0) {
      const map = new Map<string, OfficialP3MIItem>();
      for (const s of SEED_OFFICIAL_P3MI) {
        map.set(s.id, s);
      }
      for (const d of dbItems) {
        map.set(d.id, {
          id: d.id,
          name: d.name,
          normalizedName: d.normalizedName,
          licenseNumber: d.licenseNumber,
          status: d.status,
          countries: d.countries,
          jobTypes: d.jobTypes,
          address: d.address,
          contact: d.contact,
          officialUrl: d.officialUrl,
        });
      }
      return Array.from(map.values());
    }
  } catch (err) {
    console.warn("getAllOfficialP3MI db warning, using seed data:", err);
  }

  return Array.from(memoryP3MIMap.values());
}

/**
 * Mencari nomor izin SIP2MI di dalam teks mentah jika ada.
 */
export function extractSip2miCode(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\b(SIP2MI[-/][A-Z0-9/-]+|KEP\.?\s*[0-9]+[A-Z0-9/.-]+)\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Melakukan verifikasi nama perusahaan terhadap basis data resmi P3MI
 * dengan kemampuan toleran salah ketik (Fuzzy Matching / Trigram) (FR-RSM-01 s/d FR-RSM-04).
 */
export async function verifyOfficialP3MI(params: {
  companyQuery?: string | null;
  rawText?: string | null;
  sip2miCandidate?: string | null;
}): Promise<P3MIVerificationResult> {
  const { companyQuery, rawText, sip2miCandidate } = params;
  const p3miList = await getAllOfficialP3MI();

  // 1. Ekstrak atau verifikasi berdasarkan nomor SIP2MI langsung jika ada
  const detectedSip2mi =
    sip2miCandidate || (rawText ? extractSip2miCode(rawText) : null);

  if (detectedSip2mi) {
    const cleanSip = detectedSip2mi.trim().toUpperCase();
    const byLicense = p3miList.find(
      (p) => p.licenseNumber.toUpperCase().replace(/\s/g, "") === cleanSip.replace(/\s/g, "")
    );
    if (byLicense) {
      return {
        found: true,
        p3miName: byLicense.name,
        sip2miCode: byLicense.licenseNumber,
        licenseStatus: byLicense.status,
        countries: byLicense.countries,
        jobTypes: byLicense.jobTypes,
        isExact: true,
        similarityScore: 1.0,
        detail: `Nomor izin SIP2MI '${byLicense.licenseNumber}' terdaftar valid atas nama ${byLicense.name} dengan status ${byLicense.status}.`,
        link: OFFICIAL_SISKOP2MI_URL,
      };
    }
  }

  // 2. Jika tidak ada query nama perusahaan atau nama anonim
  const cleanQuery = (companyQuery || "").trim();
  const normalizedQuery = normalizeCompanyName(cleanQuery);

  const isAnonymousOrEmpty =
    !cleanQuery ||
    cleanQuery.toLowerCase().includes("tidak dicantumkan") ||
    cleanQuery.toLowerCase().includes("anonim") ||
    normalizedQuery.length < 3;

  if (isAnonymousOrEmpty) {
    return {
      found: false,
      isExact: false,
      similarityScore: 0,
      detail:
        "Nama entitas tidak dicantumkan atau tidak ditemukan pada pangkalan data resmi P3MI Kementerian Ketenagakerjaan maupun SISKOP2MI BP2MI.",
      link: OFFICIAL_SISKOP2MI_URL,
      mandatoryDisclaimer: MANDATORY_UNFOUND_DISCLAIMER,
    };
  }

  // 3. Pencarian toleran salah ketik (Fuzzy Matching)
  let bestMatch: OfficialP3MIItem | null = null;
  let highestScore = 0;

  for (const p3mi of p3miList) {
    // Cek kecocokan persis pada nama resmi atau nama normalisasi
    if (
      cleanQuery.toLowerCase() === p3mi.name.toLowerCase() ||
      normalizedQuery === p3mi.normalizedName
    ) {
      return {
        found: true,
        p3miName: p3mi.name,
        sip2miCode: p3mi.licenseNumber,
        licenseStatus: p3mi.status,
        countries: p3mi.countries,
        jobTypes: p3mi.jobTypes,
        isExact: true,
        similarityScore: 1.0,
        detail: `Perusahaan '${p3mi.name}' terdaftar aktif sebagai P3MI berizin resmi pada basis data BP2MI dan Kemnaker RI.`,
        link: OFFICIAL_SISKOP2MI_URL,
      };
    }

    // Skor fuzzy
    const score = calculateFuzzySimilarity(cleanQuery, p3mi.name);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = p3mi;
    }
  }

  // Ambang batas kecocokan toleran salah ketik: >= 0.72 (~72% kemiripan)
  if (bestMatch && highestScore >= 0.72) {
    const isExact = highestScore >= 0.95;
    const typoNote = !isExact
      ? ` (terdeteksi variasi ejaan dari '${cleanQuery}', kemiripan ${Math.round(highestScore * 100)}%)`
      : "";

    return {
      found: true,
      p3miName: bestMatch.name,
      sip2miCode: bestMatch.licenseNumber,
      licenseStatus: bestMatch.status,
      countries: bestMatch.countries,
      jobTypes: bestMatch.jobTypes,
      isExact,
      similarityScore: highestScore,
      detail: `Perusahaan '${bestMatch.name}'${typoNote} terdaftar sebagai P3MI berizin resmi pada basis data BP2MI.`,
      link: OFFICIAL_SISKOP2MI_URL,
    };
  }

  // 4. Tidak ditemukan (FR-RSM-04)
  return {
    found: false,
    isExact: false,
    similarityScore: highestScore,
    detail: `Nama entitas '${cleanQuery}' tidak ditemukan pada pangkalan data resmi P3MI Kementerian Ketenagakerjaan maupun SISKOP2MI BP2MI.`,
    link: OFFICIAL_SISKOP2MI_URL,
    mandatoryDisclaimer: MANDATORY_UNFOUND_DISCLAIMER,
  };
}
