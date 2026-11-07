import {
  calculateHammingDistance,
  calculateSimilarityPercentage,
  HAMMING_DISTANCE_MATCH_THRESHOLD,
} from "../lib/image/phash";
import {
  matchScamPosters,
  INITIAL_SCAM_POSTERS,
} from "../lib/matching/poster-matcher";
import {
  normalizeCompanyName,
  calculateLevenshteinDistance,
  calculateTrigramSimilarity,
  calculateFuzzySimilarity,
  verifyOfficialP3MI,
  MANDATORY_UNFOUND_DISCLAIMER,
} from "../lib/matching/p3mi-verifier";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log("=== Memulai Uji Akurasi Modul M4 & M5 CekLoker ===\n");

  // -------------------------------------------------------------------------
  // 1. Uji Perhitungan Hamming Distance (M4 - FR-PST-01 s/d 03)
  // -------------------------------------------------------------------------
  console.log("--- 1. Uji Hamming Distance (Selisih Bit dHash 64-bit) ---");

  // Hash identik -> distance = 0
  const d0 = calculateHammingDistance("f0e1d2c3b4a59687", "f0e1d2c3b4a59687");
  assert(d0 === 0, `Jarak hash identik harus 0, didapat: ${d0}`);
  assert(calculateSimilarityPercentage(d0) === 100, "Kemiripan hash identik harus 100%");
  console.log("✓ Hash identik menghasilkan distance = 0 (100% kemiripan)");

  // Beda 1 bit: '7' (0111) vs '6' (0110)
  const d1 = calculateHammingDistance("f0e1d2c3b4a59687", "f0e1d2c3b4a59686");
  assert(d1 === 1, `Beda 1 bit harus 1, didapat: ${d1}`);
  assert(d1 <= HAMMING_DISTANCE_MATCH_THRESHOLD, "Beda 1 bit harus <= threshold (10)");
  console.log("✓ Beda 1 bit terdeteksi akurat (distance = 1 <= 10)");

  // Beda 4 bit: '0' (0000) vs 'f' (1111)
  const d4 = calculateHammingDistance("abcdef1234567890", "abcdef123456789f");
  assert(d4 === 4, `Beda hex '0' ke 'f' pada 4 bit adalah 4 bit, didapat: ${d4}`);
  assert(d4 <= HAMMING_DISTANCE_MATCH_THRESHOLD, "Beda <= 10 bit harus cocok");
  console.log("✓ Variasi kompresi JPEG/watermark (distance = 4 <= 10) berhasil terdeteksi");

  // Beda tepat 10 bit (ambang batas maksimal kecocokan)
  // 0000000000000000 vs 00000000000003ff (3ff = 1111111111 binary = 10 bit set)
  const d10 = calculateHammingDistance("0000000000000000", "00000000000003ff");
  assert(d10 === 10, `Beda harus tepat 10 bit, didapat: ${d10}`);
  assert(d10 <= HAMMING_DISTANCE_MATCH_THRESHOLD, "Beda 10 bit masih dalam ambang batas");
  console.log("✓ Batas maksimal kemiripan (distance = 10) terpenuhi");

  // Beda 11 bit (melewati ambang batas -> tidak cocok)
  const d11 = calculateHammingDistance("0000000000000000", "00000000000007ff");
  assert(d11 === 11, `Beda harus 11 bit, didapat: ${d11}`);
  assert(d11 > HAMMING_DISTANCE_MATCH_THRESHOLD, "Beda 11 bit harus di luar batas");
  console.log("✓ Selisih 11 bit tepat ditolak (> 10)");

  // Beda seluruh bit (64 bit)
  const d64 = calculateHammingDistance("0000000000000000", "ffffffffffffffff");
  assert(d64 === 64, `Beda total harus 64 bit, didapat: ${d64}`);
  assert(calculateSimilarityPercentage(d64) === 0, "Kemiripan 64 bit harus 0%");
  console.log("✓ Kebalikan bit total menghasilkan distance = 64 (0% kemiripan)");

  // -------------------------------------------------------------------------
  // 2. Uji Pencocokan Poster Scam Terverifikasi (matchScamPosters)
  // -------------------------------------------------------------------------
  console.log("\n--- 2. Uji matchScamPosters terhadap Basis Data Scam ---");

  // Cocok dengan poster Kamboja (hash sama persis)
  const matchKamboja = await matchScamPosters(["f0e1d2c3b4a59687"]);
  assert(matchKamboja.matched === true, "Poster Kamboja harus cocok");
  assert(matchKamboja.matchedCount >= 4, `Jumlah laporan cocok minimal 4, didapat: ${matchKamboja.matchedCount}`);
  assert(matchKamboja.bestDistance === 0, "Jarak terbaik harus 0");
  assert(
    matchKamboja.findingLabel?.includes("laporan penipuan terverifikasi") ?? false,
    "Label temuan harus menyertakan laporan penipuan terverifikasi"
  );
  console.log(`✓ Poster Kamboja terverifikasi: "${matchKamboja.findingLabel}"`);

  // Cocok dengan poster Taiwan dengan variasi hash sedikit (beda 2 bit)
  const matchTaiwanNoise = await matchScamPosters(["abcdef1234567893"]); // 0 ke 3 = 2 bit beda
  assert(matchTaiwanNoise.matched === true, "Poster Taiwan dengan noise harus cocok");
  assert((matchTaiwanNoise.bestDistance ?? 99) <= 10, "Jarak harus <= 10");
  console.log(`✓ Poster Taiwan dengan noise terdeteksi (distance = ${matchTaiwanNoise.bestDistance}, kemiripan = ${matchTaiwanNoise.bestSimilarity}%)`);

  // Hash acak yang tidak ada hubungannya
  const matchRandom = await matchScamPosters(["0102030405060708"]);
  assert(matchRandom.matched === false, "Hash acak tidak boleh cocok");
  assert(matchRandom.matchedCount === 0, "Matched count harus 0");
  console.log("✓ Hash poster aman/berbeda tidak memicu false positive");

  // -------------------------------------------------------------------------
  // 3. Uji Normalisasi Nama Perusahaan & Metrik Fuzzy (M5)
  // -------------------------------------------------------------------------
  console.log("\n--- 3. Uji Normalisasi & Perhitungan Fuzzy String ---");

  const norm1 = normalizeCompanyName("PT. OS SELNAJAYA INDONESIA");
  assert(norm1 === "os selnajaya", `Hasil normalisasi salah, didapat: '${norm1}'`);
  console.log(`✓ Normalisasi 'PT. OS SELNAJAYA INDONESIA' -> '${norm1}'`);

  const norm2 = normalizeCompanyName("CV TAIWAN MANDIRI JAYA");
  assert(norm2 === "taiwan mandiri jaya", `Hasil normalisasi salah, didapat: '${norm2}'`);
  console.log(`✓ Normalisasi 'CV TAIWAN MANDIRI JAYA' -> '${norm2}'`);

  // Levenshtein
  const lev1 = calculateLevenshteinDistance("selnajaya", "selanajaya");
  assert(lev1 === 1, `Levenshtein selnajaya vs selanajaya harus 1, didapat: ${lev1}`);
  console.log("✓ Levenshtein distance typo 1 huruf: distance = 1");

  // Trigram similarity
  const tri1 = calculateTrigramSimilarity("selnajaya", "selanajaya");
  assert(tri1 >= 0.7, `Trigram similarity typo harus >= 0.7, didapat: ${tri1}`);
  console.log(`✓ Trigram similarity typo 'selnajaya' vs 'selanajaya': ${(tri1 * 100).toFixed(1)}%`);

  // -------------------------------------------------------------------------
  // 4. Uji Verifikasi Sumber Resmi P3MI (FR-RSM-01 s/d FR-RSM-04)
  // -------------------------------------------------------------------------
  console.log("\n--- 4. Uji Verifikasi Resmi P3MI (BP2MI / Kemnaker) ---");

  // 4a. Pencocokan Persis
  const resExact = await verifyOfficialP3MI({
    companyQuery: "PT OS SELNAJAYA INDONESIA",
  });
  assert(resExact.found === true, "PT OS Selnajaya harus ditemukan");
  assert(resExact.isExact === true, "Harus berstatus isExact");
  assert(resExact.p3miName === "PT OS SELNAJAYA INDONESIA", "Nama P3MI harus cocok");
  assert(resExact.sip2miCode === "SIP2MI-JPN-2026-0812", "Nomor SIP2MI harus valid");
  console.log(`✓ Exact match berhasil: ${resExact.p3miName} (${resExact.sip2miCode})`);

  // 4b. Toleran Salah Ketik (Typo 1: Penambahan huruf)
  const resTypo1 = await verifyOfficialP3MI({
    companyQuery: "PT OS Selanajaya",
  });
  assert(resTypo1.found === true, "Typo 'PT OS Selanajaya' harus tetap ditemukan");
  assert(resTypo1.p3miName === "PT OS SELNAJAYA INDONESIA", "Harus cocok ke PT OS SELNAJAYA");
  console.log(`✓ Typo tolerance (penyisipan huruf): 'PT OS Selanajaya' -> '${resTypo1.p3miName}' (Skor: ${resTypo1.similarityScore})`);

  // 4c. Toleran Salah Ketik (Typo 2: Pengurangan huruf / salah eja)
  const resTypo2 = await verifyOfficialP3MI({
    companyQuery: "PT Tiwan Mandiri",
  });
  assert(resTypo2.found === true, "Typo 'PT Tiwan Mandiri' harus ditemukan");
  assert(resTypo2.p3miName === "PT TAIWAN MANDIRI JAYA", "Harus cocok ke PT Taiwan Mandiri Jaya");
  console.log(`✓ Typo tolerance (salah eja): 'PT Tiwan Mandiri' -> '${resTypo2.p3miName}' (Skor: ${resTypo2.similarityScore})`);

  // 4d. Pencarian berbasis nomor SIP2MI pada teks poster (FR-RSM-02)
  const resSip2mi = await verifyOfficialP3MI({
    companyQuery: "Perusahaan Agen Jepang",
    rawText: "Dibutuhkan perawat lansia izin resmi SIP2MI-JPN-2026-0812 proses resmi",
  });
  assert(resSip2mi.found === true, "Harus ditemukan lewat kode SIP2MI");
  assert(resSip2mi.sip2miCode === "SIP2MI-JPN-2026-0812", "SIP2MI harus terverifikasi");
  assert(resSip2mi.p3miName === "PT OS SELNAJAYA INDONESIA", "Nama perusahaan harus sinkron");
  console.log(`✓ Pencarian via izin SIP2MI poster: ${resSip2mi.sip2miCode} -> ${resSip2mi.p3miName}`);

  // 4e. Status Tidak Ditemukan & Disclaimer Wajib (FR-RSM-04)
  const resNotFound = await verifyOfficialP3MI({
    companyQuery: "PT Sindikat Cyber Mandiri",
  });
  assert(resNotFound.found === false, "Perusahaan fiktif tidak boleh ditemukan");
  assert(
    resNotFound.mandatoryDisclaimer === MANDATORY_UNFOUND_DISCLAIMER,
    "Disclaimer wajib FR-RSM-04 harus ada saat status tidak ditemukan"
  );
  assert(
    resNotFound.mandatoryDisclaimer?.includes("bukan bukti bahwa suatu perusahaan otomatis ilegal/kriminal") ?? false,
    "Teks disclaimer harus mematuhi SRS FR-RSM-04"
  );
  console.log("✓ Status 'tidak ditemukan' berhasil menghasilkan disclaimer wajib FR-RSM-04");

  console.log("\n========================================================");
  console.log("SEMUA PENGUJIAN AKURASI M4 & M5 BERHASIL (100% PASSED)!");
  console.log("========================================================");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
