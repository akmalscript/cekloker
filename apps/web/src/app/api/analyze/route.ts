import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkGuestQuota, consumeGuestQuota } from "@/lib/rate-limit";
import { processImageForAI, type BlurRegion } from "@/lib/image/pii-blur";
import { detectPiiRegions, PiiDetectionError } from "@/lib/image/pii-ocr";
import { maskPiiText } from "@/lib/pii/detect";
import { saveScan } from "@/lib/store";
import { matchScamPosters } from "@/lib/matching/poster-matcher";
import { verifyOfficialP3MI } from "@/lib/matching/p3mi-verifier";
import {
  DEMO_COOKIE_NAME,
  DEMO_HEADER_NAME,
  DEMO_KEY,
  isValidDemoKey,
} from "@/lib/demo-access";
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

    // 1. Baca FormData terlebih dahulu agar parameter demo_key dan input dapat dievaluasi
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const teksAsli = (formData.get("teks") as string | null) ?? "";

    // 2. Verifikasi Kunci Akses Demo Juri (Option 3: demo_key=juri2026)
    // Melindungi layanan AI dari traffic publik tak dikenal dan bot agar kuota LLM tidak habis
    const demoCookie = request.cookies.get(DEMO_COOKIE_NAME)?.value;
    const demoHeader = request.headers.get(DEMO_HEADER_NAME);
    const demoQuery = request.nextUrl.searchParams.get("demo_key");
    const demoForm = formData.get("demo_key") as string | null;

    const hasValidDemoKey =
      isValidDemoKey(demoCookie) ||
      isValidDemoKey(demoHeader) ||
      isValidDemoKey(demoQuery) ||
      isValidDemoKey(demoForm);

    const isAdmin =
      session?.user?.role === "ADMIN" ||
      Boolean(session?.user?.email?.startsWith("admin@"));

    if (!hasValidDemoKey && !isAdmin) {
      return NextResponse.json(
        {
          error: "Akses pemeriksaan AI dibatasi untuk sesi demo/evaluasi juri.",
          message:
            "Silakan gunakan tautan demo resmi (?demo_key=juri2026) atau masukkan kode akses demo juri untuk mengaktifkan AI Analysis Service.",
          demo_required: true,
        },
        { status: 403 },
      );
    }

    // 3. Cek Kuota Tamu (FR-AKN-02) - hanya untuk pengguna tanpa login dan bukan sesi demo juri
    let guestId = request.cookies.get("ck_guest_session")?.value;
    let isNewGuest = false;

    if (!userId && !hasValidDemoKey) {
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

    if (files.length === 0 && !teksAsli.trim()) {
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

    if (teksAsli.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Teks melebihi batas maksimal ${MAX_TEXT_LENGTH} karakter.` },
        { status: 400 },
      );
    }

    // Samarkan NIK / nomor rekening pada teks sebelum dipakai di langkah mana pun
    // berikutnya (dikirim ke AI, dicocokkan, dan disimpan). Gambar ditangani di bawah.
    const teks = maskPiiText(teksAsli).text;

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

      // Cari NIK / nomor rekening pada gambar. Urutannya tidak boleh dibalik:
      // gambar hanya boleh dikirim ke AI setelah area sensitifnya di-blur.
      let piiRegions: BlurRegion[] = [];
      try {
        piiRegions = await detectPiiRegions(rawBuf);
      } catch (piiErr) {
        if (!(piiErr instanceof PiiDetectionError)) throw piiErr;
        console.error("Deteksi data sensitif pada gambar gagal:", piiErr);
        // Tanpa hasil OCR, letak data sensitif tidak diketahui. Secara bawaan gambar
        // tidak dikirim ke AI. PII_OCR_FAIL_OPEN=1 mengizinkan lanjut tanpa blur.
        if (process.env.PII_OCR_FAIL_OPEN !== "1") {
          return NextResponse.json(
            {
              error:
                "Pemeriksaan data sensitif pada gambar gagal, jadi gambar tidak dikirim ke AI. Silakan coba lagi.",
              error_code: "pii_check_failed",
            },
            { status: 503 },
          );
        }
      }

      const { processedBuffer, originalPhash, mimeType } =
        await processImageForAI(rawBuf, file.type, piiRegions);
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
        // Timeout 90 detik untuk pemrosesan AI (termasuk cold start)
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
      console.error(
        "Panggilan ke layanan AI gagal atau melewati batas waktu:",
        aiErr,
      );

      // Jangan pernah membuat hasil analisis palsu. Jika layanan AI tidak dapat
      // dihubungi, kembalikan error agar pengguna tahu analisis belum terjadi.
      // Kuota tamu tidak dipotong karena langkah 7 tidak tercapai.
      const isTimeout =
        aiErr instanceof Error &&
        (aiErr.name === "TimeoutError" || aiErr.name === "AbortError");
      return NextResponse.json(
        {
          error: isTimeout
            ? "Layanan AI memerlukan waktu terlalu lama untuk merespons. Server mungkin baru bangun dari mode tidur, jadi silakan coba lagi dalam beberapa saat."
            : "Layanan analisis AI sedang tidak dapat dihubungi, jadi lowongan ini belum dianalisis. Silakan coba lagi nanti.",
          error_code: isTimeout ? "ai_timeout" : "ai_unavailable",
        },
        { status: 503 },
      );
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

    // 7. Potong Kuota Tamu Hanya Saat Pemeriksaan Berhasil (HTTP 200) untuk tamu (bukan demo juri)
    const updatedQuota =
      !userId && guestId && !hasValidDemoKey
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
      isDemo: hasValidDemoKey,
    });

    // Pasang cookie sesi demo juri jika belum terpasang
    if (hasValidDemoKey && !demoCookie) {
      response.cookies.set(DEMO_COOKIE_NAME, DEMO_KEY, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60, // 30 hari
        sameSite: "lax",
        httpOnly: false,
      });
    }

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
