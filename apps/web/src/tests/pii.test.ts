import {
  findPiiWordGroups,
  maskPiiText,
  normalizeOcrNumber,
} from "../lib/pii/detect";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function masked(text: string): string {
  return maskPiiText(text).text;
}

function runTests() {
  console.log("=== Uji Penyamaran Data Pribadi (FR-PRI-01) ===\n");

  // ---------------------------------------------------------------------------
  // 1. NIK (16 digit)
  // ---------------------------------------------------------------------------
  console.log("--- 1. NIK ---");
  for (const nik of [
    "3374011234560001",
    "3374 0112 3456 0001",
    "3374-0112-3456-0001",
    "3374.0112.3456.0001",
  ]) {
    const out = masked(`NIK saya ${nik} tolong dicek`);
    assert(out === "NIK saya [NIK disamarkan] tolong dicek", `NIK "${nik}" harus disamarkan, didapat: ${out}`);
  }
  console.log("✓ NIK tanpa/dengan pemisah disamarkan");

  // ---------------------------------------------------------------------------
  // 2. Nomor rekening
  // ---------------------------------------------------------------------------
  console.log("--- 2. Nomor rekening ---");
  assert(
    masked("Transfer ke BCA 1234567890 a.n Budi") === "Transfer ke BCA [no. rekening disamarkan] a.n Budi",
    "rekening 10 digit harus disamarkan",
  );
  assert(masked("Mandiri 1370012345678") === "Mandiri [no. rekening disamarkan]", "rekening 13 digit harus disamarkan");
  assert(masked("BRI 0123-01-012345-50-1") === "BRI [no. rekening disamarkan]", "rekening bertanda strip harus disamarkan");
  assert(
    masked("No. Rekening: 081234567890") === "No. Rekening: [no. rekening disamarkan]",
    "angka mirip telepon di dekat kata 'Rekening' harus disamarkan",
  );
  assert(masked("Rek 1234 5678") === "Rek [no. rekening disamarkan]", "angka 8 digit di dekat kata 'Rek' harus disamarkan");
  console.log("✓ Nomor rekening disamarkan");

  // ---------------------------------------------------------------------------
  // 3. Bukan data pribadi (tidak boleh berubah)
  // ---------------------------------------------------------------------------
  console.log("--- 3. Teks yang tidak boleh berubah ---");
  for (const aman of [
    "Hubungi WA 081234567890 untuk daftar",
    "WA: 0812-3456-7890",
    "Telegram +62 812 3456 7890",
    "Telp (021) 570-6222",
    "Call Center BP2MI 1500-117",
    "Gaji Rp 15.000.000 per bulan",
    "Gaji Rp1.500.000.000",
    "Gaji 15 juta, berangkat 12 Maret 2026 pukul 14.30",
    "Kode SIP2MI-JPN-2026-0812",
    "",
  ]) {
    assert(masked(aman) === aman, `Teks tidak boleh diubah: "${aman}", didapat: "${masked(aman)}"`);
  }
  console.log("✓ Telepon, nominal, tanggal, dan kode tidak ikut disamarkan");

  // ---------------------------------------------------------------------------
  // 4. Beberapa data sekaligus & hitungan
  // ---------------------------------------------------------------------------
  console.log("--- 4. Beberapa data sekaligus ---");
  const multi = maskPiiText("NIK 3374011234560001, rekening BNI 0987654321, WA 081234567890");
  assert(multi.count === 2, `Harus 2 data tersamarkan, didapat: ${multi.count}`);
  assert(
    multi.text === "NIK [NIK disamarkan], rekening BNI [no. rekening disamarkan], WA 081234567890",
    `Hasil penyamaran tidak sesuai: ${multi.text}`,
  );
  console.log("✓ Banyak data pada satu teks disamarkan, nomor WA tetap utuh");

  // ---------------------------------------------------------------------------
  // 5. Kata hasil OCR
  // ---------------------------------------------------------------------------
  console.log("--- 5. Kata hasil OCR ---");
  assert(normalizeOcrNumber("3374O112345600O1") === "3374011234560001", "huruf O pada deretan angka harus dikoreksi");
  assert(normalizeOcrNumber("Rekening") === "Rekening", "kata biasa tidak boleh diubah");
  assert(normalizeOcrNumber("BCA1234567890").length === "BCA1234567890".length, "panjang kata harus tetap");

  // NIK terpecah jadi empat kata pada satu baris
  const nikGroups = findPiiWordGroups([["NIK:", "3374", "0112", "3456", "0001", "a.n", "Budi"]]);
  assert(nikGroups.length === 1, `Harus 1 kelompok, didapat: ${nikGroups.length}`);
  assert(
    nikGroups[0].line === 0 && nikGroups[0].first === 1 && nikGroups[0].last === 4 && nikGroups[0].kind === "nik",
    `Kelompok NIK salah: ${JSON.stringify(nikGroups[0])}`,
  );

  // Salah baca OCR tetap tertangkap
  const ocrGroups = findPiiWordGroups([["NIK", "3374O112345600O1"]]);
  assert(ocrGroups.length === 1 && ocrGroups[0].first === 1, "NIK dengan salah baca OCR harus tertangkap");

  // Telepon pada satu baris tidak ikut
  const phoneGroups = findPiiWordGroups([["WA", "0812", "3456", "7890"]]);
  assert(phoneGroups.length === 0, "nomor telepon tidak boleh ditandai");

  // Kata "Rekening" di baris sebelumnya menjadi konteks
  const ctxGroups = findPiiWordGroups([["No.", "Rekening"], ["081234567890"]]);
  assert(
    ctxGroups.length === 1 && ctxGroups[0].line === 1 && ctxGroups[0].first === 0,
    `Konteks dari baris sebelumnya harus dipakai: ${JSON.stringify(ctxGroups)}`,
  );

  // Deretan angka tidak boleh melintasi baris
  const splitGroups = findPiiWordGroups([["3374011234"], ["560001"]]);
  assert(splitGroups.length === 1 && splitGroups[0].line === 0, "baris kedua (6 digit) tidak boleh ikut");
  console.log("✓ Pemetaan kata OCR ke kelompok data pribadi benar");

  console.log("\n=== Semua uji penyamaran data pribadi lulus ===");
}

try {
  runTests();
} catch (error) {
  console.error(error);
  process.exit(1);
}
