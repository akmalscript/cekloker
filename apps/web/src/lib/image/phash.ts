import sharp from "sharp";

/**
 * Menghitung dHash (difference hash) 64-bit sebagai 16 karakter hex lowercase.
 * Sesuai kontrak AGENTS.md §5:
 *   - Dihitung dari gambar ASLI (sebelum PII blur)
 *   - Format string tepat 16 karakter hex: ^[0-9a-f]{16}$
 */
export async function calculatePhash(imageBuffer: Buffer): Promise<string> {
  // 1. Resize ke 9x8 grayscale (9 kolom, 8 baris) untuk membandingkan piksel bersebelahan
  const resized = await sharp(imageBuffer)
    .grayscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();

  let hashBigInt = BigInt(0);
  const oneBigInt = BigInt(1);

  // 2. Bandingkan tiap piksel dengan piksel di sebelah kanannya (8 baris x 8 perbandingan = 64 bit)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const leftPixel = resized[row * 9 + col];
      const rightPixel = resized[row * 9 + col + 1];

      hashBigInt = hashBigInt << oneBigInt;
      if (leftPixel > rightPixel) {
        hashBigInt = hashBigInt | oneBigInt;
      }
    }
  }

  // 3. Konversi ke 16 karakter hex lowercase dengan zero-padding
  const hex = hashBigInt.toString(16).padStart(16, "0").toLowerCase();
  return hex;
}

/**
 * Ambang batas maksimal selisih bit (Hamming Distance) untuk deteksi kemiripan poster penipuan (FR-PST-02).
 * Jarak bit <= 10 dari total 64 bit (~84.4% kemiripan) menandakan variasi visual gambar yang sama
 * (misal akibat kompresi JPEG, watermark, atau perbedaan resolusi).
 */
export const HAMMING_DISTANCE_MATCH_THRESHOLD = 10;

/**
 * Menghitung Hamming Distance (selisih bit) antara dua hex dHash 64-bit (16 karakter heksadesimal).
 * Rentang nilai: 0 (identik) s/d 64 (seluruh bit berbeda).
 */
export function calculateHammingDistance(hashA: string, hashB: string): number {
  const cleanA = hashA.trim().toLowerCase();
  const cleanB = hashB.trim().toLowerCase();

  if (!/^[0-9a-f]{16}$/.test(cleanA) || !/^[0-9a-f]{16}$/.test(cleanB)) {
    throw new Error(
      `Format hash tidak valid (${cleanA} vs ${cleanB}). Harus berupa 16 karakter hex lowercase.`
    );
  }

  let xor = BigInt(`0x${cleanA}`) ^ BigInt(`0x${cleanB}`);
  let distance = 0;

  while (xor > BigInt(0)) {
    if (xor & BigInt(1)) {
      distance++;
    }
    xor = xor >> BigInt(1);
  }

  return distance;
}

/**
 * Menghitung persentase kemiripan visual berdasarkan selisih bit 64-bit.
 * 0 distance = 100%, 64 distance = 0%.
 */
export function calculateSimilarityPercentage(distance: number): number {
  const clamped = Math.max(0, Math.min(64, distance));
  return Math.round(((64 - clamped) / 64) * 100);
}

