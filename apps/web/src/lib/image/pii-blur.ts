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
 * 3. Terapkan PII Blur (pada koordinat sensitif atau default redaction)
 *    - Dimensi gambar TIDAK boleh berubah (agar koordinat bbox AI presisi)
 * 4. Siap dikirim ke Gemini AI
 */
export async function processImageForAI(
  buffer: Buffer,
  mimeType: string,
  customRegionsToBlur: BlurRegion[] = []
): Promise<ProcessedImageResult> {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const width = metadata.width ?? 800;
  const height = metadata.height ?? 1000;

  // Langkah 1: Hitung pHash dari gambar ASLI (sebelum blur)
  const originalPhash = await calculatePhash(buffer);

  // Jika tidak ada region spesifik yang diminta, kita tetap pastikan gambar di-normalize
  if (customRegionsToBlur.length === 0) {
    const processedBuffer = await sharp(buffer)
      .rotate() // koreksi orientasi EXIF
      .toFormat("jpeg", { quality: 90 })
      .toBuffer();

    return {
      processedBuffer,
      originalPhash,
      width,
      height,
      mimeType: "image/jpeg",
    };
  }

  // Langkah 2: Buat layer blur untuk region sensitif yang ditentukan
  const composites: OverlayOptions[] = [];

  for (const region of customRegionsToBlur) {
    const rx = Math.max(0, Math.round(region.x * width));
    const ry = Math.max(0, Math.round(region.y * height));
    const rw = Math.min(width - rx, Math.round(region.w * width));
    const rh = Math.min(height - ry, Math.round(region.h * height));

    if (rw <= 0 || rh <= 0) continue;

    // Ekstrak area sensitif, blur secara intensif (sigma 25), lalu tempelkan kembali
    const blurredPatch = await sharp(buffer)
      .extract({ left: rx, top: ry, width: rw, height: rh })
      .blur(25)
      .toBuffer();

    composites.push({
      input: blurredPatch,
      left: rx,
      top: ry,
    });
  }

  const processedBuffer = await sharp(buffer)
    .composite(composites)
    .toFormat("jpeg", { quality: 90 })
    .toBuffer();

  return {
    processedBuffer,
    originalPhash,
    width,
    height,
    mimeType: "image/jpeg",
  };
}
