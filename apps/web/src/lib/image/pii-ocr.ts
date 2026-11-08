import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { createWorker, OEM, type Worker } from "tesseract.js";
import { findPiiWordGroups } from "@/lib/pii/detect";
import type { BlurRegion } from "./pii-blur";

/**
 * Mencari letak NIK dan nomor rekening pada gambar (FR-PRI-01).
 *
 * OCR dijalankan lokal di server (Tesseract), bukan lewat AI eksternal, karena
 * area sensitif harus diketahui SEBELUM gambar dikirim ke AI. Hasilnya berupa
 * daftar area (koordinat 0..1) yang kemudian di-blur oleh `processImageForAI`.
 */

// Sisi terpanjang gambar yang dibaca OCR. Gambar lebih besar diperkecil agar
// waktu proses dan memori terkendali. Koordinat hasil tetap proporsional.
const OCR_MAX_SIDE = 2000;
// Batas waktu satu pembacaan OCR. Dapat dinaikkan lewat env bila server lambat.
const OCR_TIMEOUT_MS = Number(process.env.PII_OCR_TIMEOUT_MS) || 45_000;
// Worker OCR memakan memori, jadi dimatikan bila lama tidak dipakai.
const WORKER_IDLE_MS = 60_000;

/** OCR gagal, sehingga letak data sensitif pada gambar tidak diketahui. */
export class PiiDetectionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PiiDetectionError";
  }
}

interface OcrWord {
  text: string;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}
// Satu paragraf: daftar baris, tiap baris berisi kata.
type OcrParagraph = OcrWord[][];

interface OcrState {
  worker?: Promise<Worker>;
  idleTimer?: ReturnType<typeof setTimeout>;
  queue: Promise<void>;
}

// Disimpan di globalThis agar tidak membuat worker baru tiap hot-reload saat dev.
const globalForOcr = globalThis as typeof globalThis & { __cekLokerOcr?: OcrState };
const state: OcrState = (globalForOcr.__cekLokerOcr ??= { queue: Promise.resolve() });

function getWorker(): Promise<Worker> {
  if (!state.worker) {
    const created = (async () => {
      // Data bahasa diunduh sekali lalu disimpan di sini. Bawaan tesseract.js
      // menulisnya ke folder kerja proyek.
      const cachePath = path.join(os.tmpdir(), "cekloker-tesseract");
      await mkdir(cachePath, { recursive: true });
      return createWorker("eng", OEM.LSTM_ONLY, { cachePath });
    })();
    state.worker = created;
    // Gagal memuat: buang agar permintaan berikutnya mencoba lagi.
    created.catch(() => {
      if (state.worker === created) state.worker = undefined;
    });
  }
  return state.worker;
}

async function stopWorker(): Promise<void> {
  const current = state.worker;
  state.worker = undefined;
  if (!current) return;
  try {
    await (await current).terminate();
  } catch {
    // Worker sudah mati atau gagal dimuat, tidak ada yang perlu dibersihkan.
  }
}

function scheduleIdleStop(): void {
  clearTimeout(state.idleTimer);
  state.idleTimer = setTimeout(() => void stopWorker(), WORKER_IDLE_MS);
  state.idleTimer.unref?.();
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Worker yang macet dimatikan agar permintaan berikutnya mulai bersih.
      void stopWorker();
      reject(new Error(`OCR melebihi batas waktu ${ms} ms`));
    }, ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

// Satu worker hanya memproses satu gambar pada satu waktu, jadi permintaan
// diantrekan. Antrean mengikuti hasil yang sudah dibatasi waktu, sehingga satu
// OCR yang macet tidak menahan permintaan berikutnya.
function runOcr(image: Buffer): Promise<OcrParagraph[]> {
  const run = state.queue.then(() => {
    clearTimeout(state.idleTimer);
    return withTimeout(
      (async () => {
        const worker = await getWorker();
        const { data } = await worker.recognize(image, {}, { blocks: true });
        return (data.blocks ?? []).flatMap((block) =>
          block.paragraphs.map((paragraph) =>
            paragraph.lines.map((line) =>
              line.words.map((word) => ({ text: word.text.trim(), bbox: word.bbox })),
            ),
          ),
        );
      })(),
      OCR_TIMEOUT_MS,
    );
  });
  state.queue = run.then(
    () => scheduleIdleStop(),
    () => scheduleIdleStop(),
  );
  return run;
}

/**
 * Cari area gambar yang berisi NIK atau nomor rekening.
 * Koordinat dinyatakan relatif terhadap gambar setelah koreksi orientasi EXIF.
 *
 * @throws PiiDetectionError bila OCR gagal. Berkas yang bukan gambar valid
 * melempar galat asli dari sharp.
 */
export async function detectPiiRegions(buffer: Buffer): Promise<BlurRegion[]> {
  const { data: ocrImage, info } = await sharp(buffer)
    .rotate()
    .resize({
      width: OCR_MAX_SIDE,
      height: OCR_MAX_SIDE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .greyscale()
    .png()
    .toBuffer({ resolveWithObject: true });

  let paragraphs: OcrParagraph[];
  try {
    paragraphs = await runOcr(ocrImage);
  } catch (err) {
    throw new PiiDetectionError("OCR untuk mendeteksi data sensitif gagal", { cause: err });
  }

  const regions: BlurRegion[] = [];
  for (const paragraph of paragraphs) {
    const groups = findPiiWordGroups(paragraph.map((line) => line.map((word) => word.text)));
    for (const group of groups) {
      const words = paragraph[group.line].slice(group.first, group.last + 1);
      const x0 = Math.min(...words.map((w) => w.bbox.x0));
      const y0 = Math.min(...words.map((w) => w.bbox.y0));
      const x1 = Math.max(...words.map((w) => w.bbox.x1));
      const y1 = Math.max(...words.map((w) => w.bbox.y1));

      // Sedikit ruang di sekeliling teks agar ujung huruf ikut tertutup.
      const pad = Math.round((y1 - y0) * 0.3) + 2;
      const left = Math.max(0, x0 - pad);
      const top = Math.max(0, y0 - pad);
      const right = Math.min(info.width, x1 + pad);
      const bottom = Math.min(info.height, y1 + pad);
      if (right <= left || bottom <= top) continue;

      regions.push({
        x: left / info.width,
        y: top / info.height,
        w: (right - left) / info.width,
        h: (bottom - top) / info.height,
      });
    }
  }
  return regions;
}
