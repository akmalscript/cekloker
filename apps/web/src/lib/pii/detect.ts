/**
 * Deteksi data pribadi sensitif pada teks (FR-PRI-01): NIK dan nomor rekening.
 *
 * Dipakai di dua tempat:
 * - teks yang ditempel pengguna, disamarkan sebelum dikirim ke AI dan disimpan
 * - kata hasil OCR pada gambar, untuk menentukan area yang harus di-blur
 *
 * Pendekatannya berbasis pola, jadi tidak menjamin semua data pribadi tertangkap.
 * Nomor telepon sengaja tidak disamarkan karena kontak perekrut adalah bukti
 * utama pada pemeriksaan lowongan.
 */

export type PiiKind = "nik" | "rekening";

export interface PiiSpan {
  start: number; // indeks awal (inklusif)
  end: number; // indeks akhir (eksklusif)
  kind: PiiKind;
}

/** Rentang kata hasil OCR yang berisi data pribadi (indeks inklusif). */
export interface PiiWordGroup {
  line: number;
  first: number;
  last: number;
  kind: PiiKind;
}

// Deretan angka (minimal 8) yang boleh dipisah satu spasi, titik, atau strip,
// mis. "3374 0112 3456 0001" atau "123-456-7890". Karena serakah, pencocokan
// selalu mengambil seluruh deretan angka dan tidak berhenti di tengah.
const DIGIT_RUN = /\d(?:[ .-]?\d){7,}/g;

// Nomor ponsel (08..., +62 8...) dan telepon rumah (kode area 02x-07x).
const PHONE_LIKE = /^(?:08\d{8,11}|0[2-7]\d{7,10}|62[2-9]\d{8,11})$/;

// Nominal rupiah dengan titik ribuan, mis. "1.500.000.000".
const FORMATTED_AMOUNT = /^\d{1,3}(?:\.\d{3})+$/;

// Kata penanda rekening pada beberapa karakter sebelum angka.
const REKENING_CONTEXT =
  /\b(?:rek(?:ening)?|norek|bank|bca|bni|bri|bsi|btn|cimb|mandiri|permata|danamon|ocbc|maybank|panin|seabank|jago)\b/i;
const CONTEXT_WINDOW = 40;

const PLACEHOLDER: Record<PiiKind, string> = {
  nik: "[NIK disamarkan]",
  rekening: "[no. rekening disamarkan]",
};

function classify(raw: string, context: string): PiiKind | null {
  if (FORMATTED_AMOUNT.test(raw)) return null;

  const digits = raw.replace(/\D/g, "");
  const n = digits.length;
  const hasRekeningContext = REKENING_CONTEXT.test(context);

  if (n === 16) return "nik";
  if (n >= 20) return "rekening";
  // 10-19 digit yang bukan nomor telepon. Nomor telepon tetap lolos kecuali
  // ada kata penanda rekening di dekatnya.
  if (n >= 10 && (hasRekeningContext || !PHONE_LIKE.test(digits))) return "rekening";
  if (n >= 8 && hasRekeningContext) return "rekening";
  return null;
}

/** Cari rentang NIK / nomor rekening pada teks. */
export function findPiiSpans(text: string): PiiSpan[] {
  const spans: PiiSpan[] = [];
  for (const match of text.matchAll(DIGIT_RUN)) {
    const start = match.index ?? 0;
    const raw = match[0];
    let context = text.slice(Math.max(0, start - CONTEXT_WINDOW), start);
    // Konteks hanya berlaku sejak angka sebelumnya, supaya kata "rekening" milik
    // angka lain tidak ikut mempengaruhi nomor telepon di sebelahnya.
    const lastDigit = context.search(/\d\D*$/);
    if (lastDigit >= 0) context = context.slice(lastDigit + 1);
    const kind = classify(raw, context);
    if (kind) spans.push({ start, end: start + raw.length, kind });
  }
  return spans;
}

/** Ganti NIK / nomor rekening pada teks dengan penanda. */
export function maskPiiText(text: string): { text: string; count: number } {
  const spans = findPiiSpans(text);
  if (spans.length === 0) return { text, count: 0 };

  let out = "";
  let cursor = 0;
  for (const span of spans) {
    out += text.slice(cursor, span.start) + PLACEHOLDER[span.kind];
    cursor = span.end;
  }
  out += text.slice(cursor);
  return { text: out, count: spans.length };
}

// Salah baca OCR yang umum pada deretan angka.
const OCR_CONFUSABLES: Record<string, string> = {
  O: "0",
  o: "0",
  Q: "0",
  D: "0",
  I: "1",
  l: "1",
  i: "1",
  "|": "1",
  Z: "2",
  z: "2",
  S: "5",
  s: "5",
  B: "8",
  g: "9",
  q: "9",
};

/**
 * Perbaiki salah baca OCR (mis. "3374O112" jadi "33740112") pada kata yang
 * didominasi angka. Panjang teks tidak berubah, jadi indeks tetap sejajar.
 */
export function normalizeOcrNumber(word: string): string {
  const core = word.replace(/[ .-]/g, "");
  if (core.length < 8) return word;
  const digitCount = core.replace(/\D/g, "").length;
  if (digitCount / core.length < 0.7) return word;
  return word.replace(/[OoQDIliZzSsBgq|]/g, (c) => OCR_CONFUSABLES[c] ?? c);
}

/**
 * Cari kata hasil OCR yang berisi NIK / nomor rekening.
 * `lines` berisi baris-baris satu paragraf, tiap baris berupa daftar kata.
 * Konteks (mis. kata "Rekening") boleh berasal dari baris sebelumnya, tetapi
 * satu deretan angka tidak pernah melintasi baris.
 */
export function findPiiWordGroups(lines: string[][]): PiiWordGroup[] {
  let text = "";
  const slots: { line: number; word: number; start: number; end: number }[] = [];

  lines.forEach((words, line) => {
    if (line > 0) text += "\n";
    words.forEach((word, index) => {
      if (index > 0) text += " ";
      const normalized = normalizeOcrNumber(word);
      slots.push({
        line,
        word: index,
        start: text.length,
        end: text.length + normalized.length,
      });
      text += normalized;
    });
  });

  const groups: PiiWordGroup[] = [];
  for (const span of findPiiSpans(text)) {
    const hit = slots.filter((s) => s.start < span.end && s.end > span.start);
    if (hit.length === 0) continue;
    groups.push({
      line: hit[0].line,
      first: hit[0].word,
      last: hit[hit.length - 1].word,
      kind: span.kind,
    });
  }
  return groups;
}
