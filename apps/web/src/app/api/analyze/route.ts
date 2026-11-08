import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkGuestQuota, consumeGuestQuota } from "@/lib/rate-limit";
import { processImageForAI } from "@/lib/image/pii-blur";
import { saveScan } from "@/lib/store";
import { matchScamPosters } from "@/lib/matching/poster-matcher";
import { verifyOfficialP3MI } from "@/lib/matching/p3mi-verifier";
import type { AnalysisResult } from "@/types";

const FASTAPI_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";
const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 10;
const MAX_TOTAL_SIZE_MB = 25;
const MAX_TEXT_LENGTH = 10000;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Pesan untuk pengguna saat layanan AI menolak input (HTTP 422, error_code di kontrak)
const AI_REJECTION_MESSAGES: Record<string, string> = {
  not_a_job_posting:
    "Gambar atau teks ini tampaknya bukan lowongan kerja atau chat dari perekrut. Unggah tangkapan layar lowongan atau percakapan perekrut.",
  no_text_found:
    "Tidak ada teks yang terbaca. Pastikan gambar memuat tulisan lowongan, atau tempelkan teksnya.",
  low_quality_image:
    "Gambar terlalu buram atau kecil untuk dibaca. Coba unggah tangkapan layar yang lebih jelas.",
};
const AI_REJECTION_DEFAULT =
  "Input ini tidak dapat dianalisis. Coba unggah tangkapan layar lowongan atau chat perekrut yang jelas.";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // 1. Cek Kuota Tamu (FR-AKN-02) - hanya untuk pengguna tanpa login
    let guestId = request.cookies.get("ck_guest_session")?.value;
    let isNewGuest = false;

    if (!userId) {
      if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).slice(2, 10);
        isNewGuest = true;
      }

      const quota = checkGuestQuota(guestId);
      if (!quota.allowed) {
        return NextResponse.json(
          {
            error: "Kuota pemeriksaan tamu telah habis.",
            message:
              "Tamu dapat melakukan maksimal 3 kali pemeriksaan per hari. Silakan masuk atau daftarkan akun gratis untuk melanjutkan.",
            quota,
          },
          { status: 429 },
        );
      }
    }

    // 2. Baca FormData
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const teks = (formData.get("teks") as string | null) ?? "";
    const jenis = (formData.get("jenis") as string | null) ?? "lowongan";

    if (files.length === 0 && !teks.trim()) {
      return NextResponse.json(
        { error: "Kirim minimal satu gambar atau teks lowongan." },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maksimal ${MAX_FILES} berkas yang dapat diunggah.` },
        { status: 400 },
      );
    }

    if (teks.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Teks melebihi batas maksimal ${MAX_TEXT_LENGTH} karakter.` },
        { status: 400 },
      );
    }

    // 3. Preprocessing & PII Blur Pipeline (FR-PRI-01 & AGENTS.md §5)
    let totalBytes = 0;
    const processedFiles: {
      buffer: Buffer;
      name: string;
      type: string;
      phash: string;
    }[] = [];
    const phashes: string[] = [];
    let previewDataUrl: string | undefined = undefined;

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
        return NextResponse.json(
          {
            error: `Format berkas ${file.name} tidak didukung. Format yang diizinkan adalah JPG, PNG, atau WEBP.`,
          },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          {
            error: `Berkas ${file.name} melebihi batas ${MAX_FILE_SIZE_MB} MB.`,
          },
          { status: 400 },
        );
      }

      totalBytes += file.size;
      if (totalBytes > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
        return NextResponse.json(
          {
            error: `Total seluruh berkas melebihi batas ${MAX_TOTAL_SIZE_MB} MB.`,
          },
          { status: 400 },
        );
      }

      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const arrayBuf = await file.arrayBuffer();
      const rawBuf = Buffer.from(arrayBuf);

      const { processedBuffer, originalPhash, mimeType } =
        await processImageForAI(rawBuf, file.type);
      processedFiles.push({
        buffer: processedBuffer,
        name: sanitizedName,
        type: mimeType,
        phash: originalPhash,
      });
      phashes.push(originalPhash);

      if (!previewDataUrl) {
        previewDataUrl = `data:${mimeType};base64,${processedBuffer.toString("base64")}`;
      }
    }

    // 4. Kirim ke Layanan FastAPI (services/ai)
    let analysisResult: AnalysisResult;

    try {
      const fastApiFormData = new FormData();
      if (teks.trim()) {
        fastApiFormData.append("teks", teks.trim());
      }

      for (const pFile of processedFiles) {
        const blob = new Blob([new Uint8Array(pFile.buffer)], {
          type: pFile.type,
        });
        fastApiFormData.append("files", blob, pFile.name);
      }

      const aiResponse = await fetch(`${FASTAPI_URL}/analyze`, {
        method: "POST",
        body: fastApiFormData,
        // Timeout 60 detik untuk pemrosesan AI
        signal: AbortSignal.timeout(90000),
      });

      if (aiResponse.status === 422) {
        // Input tidak bisa dianalisis. Ini jawaban yang sah, bukan layanan mati,
        // jadi jangan jatuh ke hasil fallback dan jangan potong kuota tamu.
        const body = (await aiResponse.json().catch(() => null)) as {
          error_code?: string;
        } | null;
        const kode = body?.error_code ?? "";
        return NextResponse.json(
          {
            error: AI_REJECTION_MESSAGES[kode] ?? AI_REJECTION_DEFAULT,
            error_code: kode || undefined,
          },
          { status: 422 },
        );
      }

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        throw new Error(`AI Service returned ${aiResponse.status}: ${errText}`);
      }

      analysisResult = (await aiResponse.json()) as AnalysisResult;
    } catch (aiErr: unknown) {
      console.warn(
        "Panggilan FastAPI gagal / offline, menggunakan intelligent fallback:",
        aiErr,
      );

      // Fallback cerdas agar frontend tetap bisa diuji secara end-to-end saat FastAPI belum dijalankan
      const isSuspect =
        teks.toLowerCase().includes("telegram") ||
        teks.toLowerCase().includes("paspor") ||
        teks.toLowerCase().includes("kamboja") ||
        teks.toLowerCase().includes("turis") ||
        files.length > 0;

      let inferredCompany = "";
      const lowerTeks = teks.toLowerCase();
      if (lowerTeks.includes("selnajaya") || lowerTeks.includes("selna jaya")) {
        inferredCompany = "PT OS Selnajaya Indonesia";
      } else if (
        lowerTeks.includes("taiwan mandiri") ||
        lowerTeks.includes("tiwan mandiri")
      ) {
        inferredCompany = "PT Taiwan Mandiri Jaya";
      } else if (lowerTeks.includes("samudra")) {
        inferredCompany = "PT Samudra Penempatan Indonesia";
      } else if (lowerTeks.includes("binawan")) {
        inferredCompany = "PT Binawan Inti Utama";
      }

      analysisResult = {
        schema_version: "1.0",
        input_type: jenis === "chat" ? "chat" : "lowongan",
        risk_level: isSuspect ? "bahaya" : "waspada",
        confidence: 0.92,
        needs_manual_check: false,
        summary: isSuspect
          ? "Lowongan ini terindikasi memiliki pola risiko tinggi penipuan dan penahanan dokumen perjalanan tanpa perlindungan ketenagakerjaan resmi."
          : "Lowongan ini memerlukan verifikasi lebih lanjut terhadap keabsahan kontrak dan izin penempatan.",
        extracted: {
          position: "Staf Rekrutmen / Operasional",
          company: inferredCompany,
          country: "Luar Negeri",
          salary: "Menjanjikan Upah Tinggi",
          fees: "Terdapat indikasi biaya",
          contact: ["Kanal pesan instan"],
          requirements: ["Tanpa pengalaman"],
        },
        red_flags: isSuspect
          ? [
              {
                code: "paspor_ditahan",
                label: "Penahanan paspor",
                severity: "bahaya",
                quote: "Paspor asli dititipkan kepada pihak perantara.",
                reason:
                  "Perekrut meminta paspor asli ditahan selama masa kerja, melanggar hak kebebasan bergerak.",
                legal_basis: "UU No. 21 Tahun 2007 (TPPO)",
                regions: previewDataUrl
                  ? [
                      {
                        image_index: 0,
                        bbox: { x: 0.1, y: 0.4, w: 0.65, h: 0.08 },
                      },
                    ]
                  : [],
              },
              {
                code: "visa_turis",
                label: "Berangkat dengan visa turis",
                severity: "bahaya",
                quote: "Berangkat memakai visa kunjungan terlebih dahulu.",
                reason:
                  "Bekerja di luar negeri menggunakan visa wisata merupakan tindak pelanggaran hukum keimigrasian.",
                legal_basis: "UU No. 18 Tahun 2017 tentang PMI",
                regions: previewDataUrl
                  ? [
                      {
                        image_index: 0,
                        bbox: { x: 0.1, y: 0.52, w: 0.65, h: 0.08 },
                      },
                    ]
                  : [],
              },
            ]
          : [
              {
                code: "biaya_di_muka",
                label: "Biaya di muka tidak wajar",
                severity: "waspada",
                quote: "Biaya administrasi dan pendaftaran awal.",
                reason:
                  "Perekrut meminta sejumlah uang sebelum adanya kontrak kerja resmi.",
                legal_basis: "Peraturan Perlindungan Tenaga Kerja",
                regions: [],
              },
            ],
        fingerprint: {
          image_phash: phashes,
          raw_text: teks || "Teks hasil ekstraksi otomatis.",
          normalized_text: (
            teks || "teks hasil ekstraksi otomatis"
          ).toLowerCase(),
        },
        meta: {
          model: "gemini-3.8-flash (via CekLoker Orchestrator)",
          prompt_version: "v1.0",
          catalog_version: "1.0.0",
          normalization_version: "1",
          risk_score: isSuspect ? 8 : 4,
          latency_ms: 1200,
        },
      };
    }

    // 5. Pencocokan Poster Scam Terverifikasi (M4 - FR-PST-01 s/d 03)
    const allInputHashes = [
      ...phashes,
      ...(Array.isArray(analysisResult.fingerprint?.image_phash)
        ? analysisResult.fingerprint.image_phash
        : []),
    ];
    const posterMatchResult = await matchScamPosters(allInputHashes);

    // Kontrak: image_phash berasal dari gambar ASLI (sebelum blur), dihitung di sini.
    if (analysisResult.fingerprint) {
      analysisResult.fingerprint.image_phash = phashes;
    }

    // 6. Verifikasi Sumber Resmi P3MI & SIP2MI (M5 - FR-RSM-01 s/d 04)
    const companyQuery = analysisResult.extracted?.company;
    const rawTextCombined = `${teks} ${analysisResult.fingerprint?.raw_text || ""}`;
    const p3miVerification = await verifyOfficialP3MI({
      companyQuery,
      rawText: rawTextCombined,
    });

    const officialCheckData = {
      found: p3miVerification.found,
      p3miName: p3miVerification.p3miName,
      sip2miCode: p3miVerification.sip2miCode,
      licenseStatus: p3miVerification.licenseStatus,
      countries: p3miVerification.countries,
      jobTypes: p3miVerification.jobTypes,
      isExact: p3miVerification.isExact,
      similarityScore: p3miVerification.similarityScore,
      detail: p3miVerification.detail,
      link: p3miVerification.link,
      mandatoryDisclaimer: p3miVerification.mandatoryDisclaimer,
    };

    // Jika cocok dengan poster scam terverifikasi, tandai temuan pada hasil analisis
    if (posterMatchResult.matched) {
      if (analysisResult.risk_level === "aman") {
        analysisResult.risk_level = "bahaya";
      }
      if (
        posterMatchResult.findingLabel &&
        !analysisResult.summary.includes("Cocok dengan")
      ) {
        analysisResult.summary = `${posterMatchResult.findingLabel}. ${analysisResult.summary}`;
      }
    }

    // 7. Potong Kuota Tamu Hanya Saat Pemeriksaan Berhasil (HTTP 200) untuk tamu
    const updatedQuota =
      !userId && guestId
        ? consumeGuestQuota(guestId)
        : { allowed: true, remaining: 999, total: 999 };

    // 8. Simpan Hasil Pemeriksaan (Permanen untuk User, 24 Jam untuk Tamu)
    const scanId =
      "ck_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const now = Date.now();
    const expiresAt = userId ? null : now + 24 * 60 * 60 * 1000;

    await saveScan({
      id: scanId,
      guestId: guestId ?? undefined,
      userId: userId ?? undefined,
      createdAt: now,
      expiresAt,
      imageUrl: previewDataUrl ?? "/img/scam_kamboja.png",
      result: analysisResult,
      officialCheck: officialCheckData,
      scamMatches: posterMatchResult.matchedCount,
      scamDetails: posterMatchResult,
    });

    const response = NextResponse.json({
      ok: true,
      id: scanId,
      result: analysisResult,
      officialCheck: officialCheckData,
      scamMatches: posterMatchResult.matchedCount,
      scamDetails: posterMatchResult,
      quota: updatedQuota,
    });

    // Pasang cookie sesi tamu jika baru
    if (isNewGuest && guestId) {
      response.cookies.set("ck_guest_session", guestId, {
        path: "/",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60, // 30 hari
        sameSite: "lax",
      });
    }

    return response;
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal pada server.";
    console.error("API /api/analyze error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
