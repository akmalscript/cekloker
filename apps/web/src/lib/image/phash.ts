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
