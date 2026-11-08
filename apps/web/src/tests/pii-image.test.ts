/**
 * Uji PII blur pada gambar (FR-PRI-01): OCR lokal mencari NIK / nomor rekening,
 * area itu di-blur, lalu hasilnya dibaca ulang untuk memastikan tidak ada data
 * pribadi yang tersisa sementara nomor telepon dan gaji tetap terbaca.
 *
 * Gambar uji ada di src/tests/fixtures (isinya data palsu).
 * Catatan: pada run pertama, data bahasa OCR (sekitar 2 MB) diunduh dari CDN
 * ke folder temp sistem, jadi perlu koneksi internet.
 */
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { createWorker, OEM } from "tesseract.js";
import { processImageForAI } from "../lib/image/pii-blur";
import { detectPiiRegions } from "../lib/image/pii-ocr";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

const FIXTURES = path.join(__dirname, "fixtures");

// Data palsu yang ada pada gambar uji. Nomor rekening BCA sengaja dicek terpisah
// karena merupakan bagian dari nomor telepon (0812-3456-7890).
const NIK = "3374011234560001";
const REKENING_MANDIRI = "1370012345678";
const REKENING_BRI = "012301012345501";
const REKENING_BCA = "1234567890";
const TELEPON = "081234567890";
const GAJI = "15000000";

const CASES = [
  { file: "chat-terang.png", minRegions: 4 },
  { file: "chat-gelap.png", minRegions: 4 },
  { file: "screenshot-ponsel.png", minRegions: 3 },
  { file: "tanpa-pii.png", minRegions: 0, maxRegions: 0 },
];

type OcrWorker = Awaited<ReturnType<typeof createWorker>>;

async function bacaAngka(worker: OcrWorker, image: Buffer): Promise<string> {
  const { data } = await worker.recognize(image);
  return data.text.replace(/\D/g, "");
}

function assertTidakAdaDataPribadi(angka: string, label: string) {
  // Hilangkan nomor telepon dulu agar nomor rekening BCA (yang menjadi bagian
  // dari nomor telepon) tidak terhitung sebagai sisa data pribadi.
  const tanpaTelepon = angka.replace(TELEPON, "");
  for (const rahasia of [NIK, REKENING_MANDIRI, REKENING_BRI, REKENING_BCA]) {
    assert(!tanpaTelepon.includes(rahasia), `${label}: ${rahasia} masih terbaca setelah blur`);
  }
}

async function runTests() {
  console.log("=== Uji PII Blur pada Gambar (FR-PRI-01) ===\n");

  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    cachePath: path.join(os.tmpdir(), "cekloker-tesseract"),
  });

  try {
    for (const c of CASES) {
      console.log(`--- ${c.file} ---`);
      const input = await readFile(path.join(FIXTURES, c.file));
      const meta = await sharp(input).metadata();

      const regions = await detectPiiRegions(input);
      assert(regions.length >= c.minRegions, `${c.file}: area terdeteksi ${regions.length}, minimal ${c.minRegions}`);
      if (c.maxRegions !== undefined) {
        assert(regions.length <= c.maxRegions, `${c.file}: tidak boleh ada area terdeteksi, didapat ${regions.length}`);
      }

      const out = await processImageForAI(input, "image/png", regions);
      assert(
        out.width === meta.width && out.height === meta.height,
        `${c.file}: dimensi harus tetap ${meta.width}x${meta.height}, didapat ${out.width}x${out.height}`,
      );

      const sisa = await detectPiiRegions(out.processedBuffer);
      assert(sisa.length === 0, `${c.file}: setelah blur masih ada ${sisa.length} area data pribadi`);

      const angka = await bacaAngka(worker, out.processedBuffer);
      assertTidakAdaDataPribadi(angka, c.file);
      assert(angka.includes(TELEPON), `${c.file}: nomor telepon harus tetap terbaca`);
      console.log(`✓ ${regions.length} area di-blur, data pribadi tidak terbaca, nomor telepon tetap utuh`);
    }

    // Gambar ber-EXIF orientation 6 (piksel tersimpan terputar). Area blur harus
    // jatuh pada teks yang benar dan dimensi hasil mengikuti gambar yang sudah tegak.
    console.log("--- chat-terang.png dengan EXIF orientation 6 ---");
    const asli = await readFile(path.join(FIXTURES, "chat-terang.png"));
    const exif = await sharp(asli)
      .rotate(270)
      .withMetadata({ orientation: 6 })
      .jpeg({ quality: 92 })
      .toBuffer();
    const regions = await detectPiiRegions(exif);
    assert(regions.length >= 4, `EXIF: area terdeteksi ${regions.length}, minimal 4`);
    const out = await processImageForAI(exif, "image/jpeg", regions);
    assert(out.width === 900 && out.height === 600, `EXIF: dimensi harus 900x600, didapat ${out.width}x${out.height}`);
    const angka = await bacaAngka(worker, out.processedBuffer);
    assertTidakAdaDataPribadi(angka, "EXIF");
    assert(angka.includes(TELEPON), "EXIF: nomor telepon harus tetap terbaca");
    assert(angka.includes(GAJI), "EXIF: nominal gaji harus tetap terbaca");
    console.log("✓ Orientasi EXIF ditangani dengan benar");
  } finally {
    await worker.terminate();
  }

  console.log("\n=== Semua uji PII blur pada gambar lulus ===");
}

runTests().then(
  // Worker OCR milik aplikasi menahan proses tetap hidup, jadi keluar eksplisit.
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
