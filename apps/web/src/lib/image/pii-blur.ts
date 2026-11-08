import sharp, { type OverlayOptions } from "sharp";
import { calculatePhash } from "./phash";

export interface BlurRegion {
  x: number; // 0..1 (persentase)
  y: number;
  w: number;
  h: number;
}

export interface ProcessedImageResult {
  processedBuffer: Buffer;
  originalPhash: string;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Memproses gambar sesuai aturan pipeline CekLoker (FR-PRI-01 & AGENTS.md §5):
 * 1. [Gambar masuk]
 * 2. Hitung pHash dari ORIGINAL (sebelum blur)
 * 3. Terapkan PII Blur pada area sensitif (lihat `detectPiiRegions` di pii-ocr.ts)
 *    - Dimensi gambar TIDAK boleh berubah (agar koordinat bbox AI presisi)
 * 4. Siap dikirim ke Gemini AI
 *
 * Koordinat `customRegionsToBlur` relatif terhadap gambar setelah koreksi
 * orientasi EXIF, sama dengan yang dilihat pengguna dan AI.
 */
export async function processImageForAI(
  buffer: Buffer,
  mimeType: string,
  customRegionsToBlur: BlurRegion[] = []
): Promise<ProcessedImageResult> {
  const metadata = await sharp(buffer).metadata();

  // Orientasi EXIF 5-8 menukar lebar dan tinggi setelah gambar diputar.
  const rotated = (metadata.orientation ?? 1) >= 5;
  const width = (rotated ? metadata.height : metadata.width) ?? 800;
  const height = (rotated ? metadata.width : metadata.height) ?? 1000;

  // Langkah 1: Hitung pHash dari gambar ASLI (sebelum blur)
  const originalPhash = await calculatePhash(buffer);

  // Langkah 2: Buat layer blur untuk region sensitif yang ditentukan
  const composites: OverlayOptions[] = [];

  for (const region of customRegionsToBlur) {
    const left = clamp(Math.floor(region.x * width), 0, width - 1);
    const top = clamp(Math.floor(region.y * height), 0, height - 1);
    const right = clamp(Math.ceil((region.x + region.w) * width), left + 1, width);
    const bottom = clamp(Math.ceil((region.y + region.h) * height), top + 1, height);
    const rw = right - left;
    const rh = bottom - top;

    // Ekstrak area sensitif, blur secara intensif, lalu tempelkan kembali.
    // Sigma dibuat lebih besar dari tinggi area dan mask dibuat akurat
    // (minAmplitude kecil) supaya bentuk angka tidak tersisa sebagai bayangan
    // yang bisa dipertajam kembali kontrasnya.
    const blurredPatch = await sharp(buffer)
      .rotate() // koreksi orientasi EXIF sebelum memotong
      .extract({ left, top, width: rw, height: rh })
      .blur({ sigma: Math.max(40, rh), minAmplitude: 0.01, precision: "float" })
      .png()
      .toBuffer();

    composites.push({
      input: blurredPatch,
      left,
      top,
    });
  }

  let pipeline = sharp(buffer).rotate(); // koreksi orientasi EXIF
  if (composites.length > 0) {
    pipeline = pipeline.composite(composites);
  }
  const processedBuffer = await pipeline.toFormat("jpeg", { quality: 90 }).toBuffer();

  return {
    processedBuffer,
    originalPhash,
    width,
    height,
    mimeType: "image/jpeg",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
