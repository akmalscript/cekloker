import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import type { DatabaseLokerEntry } from "@/app/api/database-loker/route";

export interface DatabasePdfOptions {
  entries: DatabaseLokerEntry[];
  cari?: string;
  negara?: string;
  jenis?: string;
  totalFiltered?: number;
}

function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2026]/g, "...")
    .replace(/[^\x00-\x7F]/g, " ");
}

export async function generateDatabasePdf(
  options: DatabasePdfOptions,
): Promise<Uint8Array> {
  const { entries, cari, negara, jenis, totalFiltered } = options;

  const pdfDoc = await PDFDocument.create();

  // Load Standard Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // A4 Size: 595.28 x 841.89 points
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Watermark helper
  const addWatermark = (p: typeof page) => {
    p.drawText("DOKUMEN RESMI CEKLOKER - ARSIP PENCEGAHAN PENIPUAN / TPPO", {
      x: 35,
      y: 220,
      size: 14,
      font: fontBold,
      color: rgb(0.88, 0.91, 0.96),
      rotate: degrees(45),
    });
    p.drawText("REPUBLIK INDONESIA - SISTEM VERIFIKASI KEAMANAN KERJA", {
      x: 75,
      y: 180,
      size: 12,
      font: fontBold,
      color: rgb(0.91, 0.93, 0.97),
      rotate: degrees(45),
    });
  };

  // Wrap text helper
  const wrapText = (
    text: string,
    maxWidth: number,
    font: typeof fontRegular,
    fontSize: number,
  ): string[] => {
    const cleaned = cleanText(text);
    const words = cleaned.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);
      if (testWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Space check helper
  const checkSpace = (neededHeight: number) => {
    if (currentY - neededHeight < margin + 35) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      addWatermark(page);
      currentY = pageHeight - margin;
    }
  };

  addWatermark(page);

  // Design Tokens (CekLoker System)
  const navyColor = rgb(0.12, 0.23, 0.54); // #1E3A8A
  const darkInk = rgb(0.06, 0.09, 0.16); // #0F172A
  const mutedColor = rgb(0.35, 0.42, 0.52); // #5A6A85
  const lineBorder = rgb(0.88, 0.91, 0.94); // #E2E8F0
  const bahayaColor = rgb(0.86, 0.15, 0.15); // #DC2626
  const bahayaBg = rgb(0.99, 0.95, 0.95);
  const waspadaColor = rgb(0.85, 0.47, 0.02); // #D97706
  const waspadaBg = rgb(1.0, 0.98, 0.92);

  // 1. KOP DOKUMEN / HEADER UTAMA
  page.drawRectangle({
    x: margin,
    y: currentY - 56,
    width: contentWidth,
    height: 56,
    color: rgb(0.94, 0.96, 0.98),
    borderColor: lineBorder,
    borderWidth: 1,
  });

  page.drawText("CEKLOKER - BASIS DATA LOWONGAN TERINDIKASI PENIPUAN", {
    x: margin + 14,
    y: currentY - 20,
    size: 12,
    font: fontBold,
    color: navyColor,
  });

  page.drawText(
    "Arsip Temuan Lowongan Kerja Mencurigakan & Laporan Terkonfirmasi Masyarakat",
    {
      x: margin + 14,
      y: currentY - 34,
      size: 9,
      font: fontRegular,
      color: mutedColor,
    },
  );

  const exportDateStr = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  page.drawText(`Diekspor: ${cleanText(exportDateStr)} WIB`, {
    x: margin + 14,
    y: currentY - 48,
    size: 8,
    font: fontOblique,
    color: mutedColor,
  });

  currentY -= 68;

  // 2. METADATA FILTER & RINGKASAN
  const filterParts: string[] = [];
  if (cari) filterParts.push(`Pencarian: "${cleanText(cari)}"`);
  if (negara && negara !== "Semua Negara")
    filterParts.push(`Negara: ${cleanText(negara)}`);
  if (jenis) filterParts.push(`Kategori: ${cleanText(jenis)}`);

  const filterSummary =
    filterParts.length > 0 ? filterParts.join(" | ") : "Semua Filter";
  const countSummary = `Menampilkan ${entries.length} dari ${totalFiltered ?? entries.length} entri`;

  page.drawRectangle({
    x: margin,
    y: currentY - 24,
    width: contentWidth,
    height: 24,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: lineBorder,
    borderWidth: 1,
  });

  page.drawText(countSummary, {
    x: margin + 10,
    y: currentY - 16,
    size: 8.5,
    font: fontBold,
    color: darkInk,
  });

  page.drawText(cleanText(filterSummary), {
    x: margin + 220,
    y: currentY - 16,
    size: 8,
    font: fontRegular,
    color: mutedColor,
  });

  currentY -= 32;

  // 3. DISCLAIMER RESMI (FR-LOK-09, FR-LOK-10)
  const disclaimerText =
    "Penting: Data ini dikompilasi oleh CekLoker sebagai instrumen transparansi dan edukasi pencegahan tindak penipuan rekrutmen / TPPO. Bukan merupakan putusan hukum resmi pengadilan. Verifikasi mandiri disarankan melalui kanal resmi Kemnaker RI dan BP2MI.";
  const disclaimerLines = wrapText(
    disclaimerText,
    contentWidth - 20,
    fontOblique,
    7.5,
  );
  const disclaimerHeight = disclaimerLines.length * 11 + 10;

  page.drawRectangle({
    x: margin,
    y: currentY - disclaimerHeight,
    width: contentWidth,
    height: disclaimerHeight,
    color: rgb(0.97, 0.97, 0.98),
    borderColor: lineBorder,
    borderWidth: 0.5,
  });

  disclaimerLines.forEach((line, idx) => {
    page.drawText(line, {
      x: margin + 10,
      y: currentY - 12 - idx * 11,
      size: 7.5,
      font: fontOblique,
      color: mutedColor,
    });
  });

  currentY -= disclaimerHeight + 14;

  // Helper to determine severity
  const isSevereFlag = (flags: string[]) => {
    const severe = ["biaya", "paspor", "sensitif", "turis", "telegram"];
    return flags.some((f) => severe.some((s) => f.toLowerCase().includes(s)));
  };

  // 4. DAFTAR KARTU LOWONGAN
  if (entries.length === 0) {
    page.drawText("Tidak ada data lowongan yang ditemukan untuk filter ini.", {
      x: margin + 14,
      y: currentY - 20,
      size: 10,
      font: fontOblique,
      color: mutedColor,
    });
  } else {
    for (let i = 0; i < entries.length; i++) {
      const item = entries[i];
      const severe = isSevereFlag(item.flags);

      const titleText = `${cleanText(item.pos)} - ${cleanText(item.org)}`;
      const titleLines = wrapText(titleText, contentWidth - 120, fontBold, 10);
      const flagsText =
        item.flags.length > 0
          ? cleanText(item.flags.join(" • "))
          : "Tanpa catatan bendera";
      const flagsLines = wrapText(
        `Indikasi: ${flagsText}`,
        contentWidth - 24,
        fontRegular,
        8,
      );

      const cardHeight = 44 + titleLines.length * 13 + flagsLines.length * 11;
      checkSpace(cardHeight + 10);

      // Card Box
      page.drawRectangle({
        x: margin,
        y: currentY - cardHeight,
        width: contentWidth,
        height: cardHeight,
        color: rgb(1, 1, 1),
        borderColor: lineBorder,
        borderWidth: 1,
      });

      // Left Accent Border
      page.drawRectangle({
        x: margin,
        y: currentY - cardHeight,
        width: 3.5,
        height: cardHeight,
        color: severe ? bahayaColor : waspadaColor,
      });

      // Severity Badge (Kanan Atas)
      const badgeW = 68;
      const badgeH = 18;
      const badgeX = margin + contentWidth - badgeW - 10;
      const badgeY = currentY - 24;

      page.drawRectangle({
        x: badgeX,
        y: badgeY,
        width: badgeW,
        height: badgeH,
        color: severe ? bahayaBg : waspadaBg,
        borderColor: severe ? bahayaColor : waspadaColor,
        borderWidth: 1,
      });

      page.drawText(severe ? "BAHAYA" : "WASPADA", {
        x: badgeX + (severe ? 14 : 10),
        y: badgeY + 5,
        size: 8,
        font: fontBold,
        color: severe ? bahayaColor : waspadaColor,
      });

      // Title Lines
      let textCursorY = currentY - 16;
      titleLines.forEach((tLine) => {
        page.drawText(tLine, {
          x: margin + 12,
          y: textCursorY,
          size: 10,
          font: fontBold,
          color: darkInk,
        });
        textCursorY -= 13;
      });

      // Meta Line: ID, Tanggal, Negara, Laporan
      const metaStr = `ID: ${cleanText(item.id)}  |  Verifikasi: ${cleanText(item.date)}  |  Negara: ${cleanText(
        item.country || "-",
      )}  |  Dilaporkan: ${item.reports} kali`;

      page.drawText(metaStr, {
        x: margin + 12,
        y: textCursorY,
        size: 8,
        font: fontRegular,
        color: mutedColor,
      });
      textCursorY -= 14;

      // Red Flag Indikator
      flagsLines.forEach((fLine) => {
        page.drawText(fLine, {
          x: margin + 12,
          y: textCursorY,
          size: 8,
          font: fontRegular,
          color: severe ? bahayaColor : waspadaColor,
        });
        textCursorY -= 11;
      });

      currentY -= cardHeight + 8;
    }
  }

  // 5. FOOTER & NOMOR HALAMAN
  const allPages = pdfDoc.getPages();
  const totalPages = allPages.length;

  allPages.forEach((p, index) => {
    p.drawLine({
      start: { x: margin, y: 32 },
      end: { x: margin + contentWidth, y: 32 },
      thickness: 0.5,
      color: lineBorder,
    });

    p.drawText(
      "CekLoker.id — Platform Perlindungan & Verifikasi Lowongan Kerja Indonesia",
      {
        x: margin,
        y: 20,
        size: 7.5,
        font: fontRegular,
        color: mutedColor,
      },
    );

    const pageStr = `Halaman ${index + 1} dari ${totalPages}`;
    const pageStrWidth = fontRegular.widthOfTextAtSize(pageStr, 7.5);
    p.drawText(pageStr, {
      x: margin + contentWidth - pageStrWidth,
      y: 20,
      size: 7.5,
      font: fontRegular,
      color: mutedColor,
    });
  });

  return await pdfDoc.save();
}

export async function downloadDatabasePdf(
  options: DatabasePdfOptions,
): Promise<void> {
  const pdfBytes = await generateDatabasePdf(options);
  const blob = new Blob([pdfBytes as unknown as BlobPart], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `database-loker-cekloker-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
