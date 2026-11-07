import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

export interface ReportPdfData {
  scanId: string;
  createdAt?: string | Date;
  jobTitle?: string;
  companyName?: string;
  type?: string;
  riskLevel: "aman" | "waspada" | "bahaya";
  confidence: number;
  summary: string;
  redFlags?: Array<{
    code: string;
    label: string;
    severity: "waspada" | "bahaya";
    reason: string;
    legal_basis?: string;
  }>;
  officialCheck?: {
    found: boolean;
    p3miName?: string | null;
    licenseStatus?: string | null;
    detail?: string | null;
  };
  scamMatches?: number;
}

export async function generateFormalReportPdf(data: ReportPdfData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  // Load Standard Fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // A4 Size: 595.28 x 841.89 points
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Helper to add watermark across page
  const addWatermark = (p: typeof page) => {
    p.drawText("DOKUMEN BUKTI RESMI CEKLOKER - TUJUAN PELAPORAN HUKUM", {
      x: 60,
      y: 220,
      size: 16,
      font: fontBold,
      color: rgb(0.85, 0.88, 0.94),
      rotate: degrees(45),
    });
    p.drawText("VERIFIKASI SISTEM KEAMANAN KERJA RI", {
      x: 100,
      y: 180,
      size: 14,
      font: fontBold,
      color: rgb(0.88, 0.9, 0.95),
      rotate: degrees(45),
    });
  };

  // Helper for line wrapping
  const wrapText = (text: string, maxWidth: number, font: typeof fontRegular, fontSize: number): string[] => {
    const words = text.split(" ");
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

  // Ensure page space or add new page
  const checkSpace = (neededHeight: number) => {
    if (currentY - neededHeight < margin + 40) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      addWatermark(page);
      currentY = pageHeight - margin;
    }
  };

  addWatermark(page);

  // Colors
  const navyColor = rgb(0.12, 0.23, 0.54); // #1E3A8A
  const darkInk = rgb(0.06, 0.09, 0.16); // #0F172A
  const mutedColor = rgb(0.35, 0.42, 0.52); // #5A6A85
  const lineBorder = rgb(0.88, 0.91, 0.94); // #E2E8F0

  let riskColor = rgb(0.09, 0.64, 0.29); // Aman #16A34A
  let riskBg = rgb(0.94, 0.99, 0.96);
  let riskLabelText = "AMAN (RISIKO RENDAH)";
  if (data.riskLevel === "bahaya") {
    riskColor = rgb(0.86, 0.15, 0.15); // Bahaya #DC2626
    riskBg = rgb(1.0, 0.95, 0.95);
    riskLabelText = "BAHAYA (TERINDIKASI RISIKO TINGGI / SCAM)";
  } else if (data.riskLevel === "waspada") {
    riskColor = rgb(0.85, 0.47, 0.02); // Waspada #D97706
    riskBg = rgb(1.0, 0.98, 0.92);
    riskLabelText = "WASPADA (TERINDIKASI RISIKO SEDANG)";
  }

  // --- HEADER RESMI ---
  page.drawRectangle({
    x: margin,
    y: currentY - 55,
    width: contentWidth,
    height: 55,
    color: rgb(0.94, 0.96, 0.98),
    borderColor: lineBorder,
    borderWidth: 1,
  });

  page.drawText("CEKLOKER — SISTEM DETEKSI INDIKASI RISIKO LOWONGAN KERJA", {
    x: margin + 14,
    y: currentY - 20,
    size: 13,
    font: fontBold,
    color: navyColor,
  });

  page.drawText("Laporan Resmi Hasil Evaluasi Kecerdasan Buatan & Investigasi Legalitas", {
    x: margin + 14,
    y: currentY - 34,
    size: 9,
    font: fontRegular,
    color: mutedColor,
  });

  const nowFormatted = new Date(data.createdAt || Date.now()).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const docNo = `DOK-CK-2026-${(data.scanId || "0000").slice(-6).toUpperCase()}`;
  page.drawText(`No. Berkas : ${docNo}`, {
    x: margin + 14,
    y: currentY - 48,
    size: 8,
    font: fontBold,
    color: darkInk,
  });

  page.drawText(`Terbit : ${nowFormatted} WIB`, {
    x: margin + contentWidth - 175,
    y: currentY - 48,
    size: 8,
    font: fontRegular,
    color: mutedColor,
  });

  currentY -= 70;

  // --- RINGKASAN STATUS RISIKO (BANNER) ---
  page.drawRectangle({
    x: margin,
    y: currentY - 44,
    width: contentWidth,
    height: 44,
    color: riskBg,
    borderColor: riskColor,
    borderWidth: 1.5,
  });

  page.drawText(riskLabelText, {
    x: margin + 14,
    y: currentY - 18,
    size: 12,
    font: fontBold,
    color: riskColor,
  });

  const confidencePct = Math.round((data.confidence > 1 ? data.confidence : data.confidence * 100));
  const redFlagsCount = data.redFlags ? data.redFlags.length : 0;
  const metaStatus = `Skor Keyakinan AI: ${confidencePct}%  |  Temuan Red Flag: ${redFlagsCount} Indikator  |  Kecocokan Scam: ${data.scamMatches || 0} Kasus`;

  page.drawText(metaStatus, {
    x: margin + 14,
    y: currentY - 34,
    size: 8.5,
    font: fontRegular,
    color: darkInk,
  });

  currentY -= 56;

  // --- IDENTITAS LOWONGAN YANG DIPERIKSA ---
  page.drawText("I. IDENTITAS LOWONGAN YANG DIPERIKSA", {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: navyColor,
  });
  currentY -= 6;

  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + contentWidth, y: currentY },
    thickness: 1,
    color: lineBorder,
  });
  currentY -= 14;

  const jobDetails = [
    { label: "Posisi Pekerjaan", val: data.jobTitle || "Tidak teridentifikasi spesifik" },
    { label: "Nama Perusahaan / Perekrut", val: data.companyName || "Anonim / Tidak terdaftar" },
    { label: "Jenis Dokumen Uji", val: data.type === "chat" ? "Tangkapan Layar Percakapan Chat" : "Poster / Berkas Lowongan" },
    { label: "ID Pemeriksaan Unik", val: data.scanId || "-" },
  ];

  for (const item of jobDetails) {
    page.drawText(`${item.label}`, {
      x: margin + 6,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: darkInk,
    });
    page.drawText(`:  ${item.val}`, {
      x: margin + 160,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: darkInk,
    });
    currentY -= 13;
  }
  currentY -= 6;

  // --- RINGKASAN ANALISIS EKSEKUTIF ---
  page.drawText("II. RINGKASAN EVALUASI & ANALISIS RISIKO", {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: navyColor,
  });
  currentY -= 6;

  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + contentWidth, y: currentY },
    thickness: 1,
    color: lineBorder,
  });
  currentY -= 14;

  const summaryLines = wrapText(data.summary, contentWidth - 16, fontRegular, 8.5);
  for (const line of summaryLines) {
    checkSpace(14);
    page.drawText(line, {
      x: margin + 6,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: darkInk,
    });
    currentY -= 12;
  }
  currentY -= 8;

  // --- STATUS JALUR RESMI KEMNAKER / P3MI ---
  checkSpace(65);
  page.drawText("III. STATUS VERIFIKASI JALUR RESMI (P3MI / SIP2MI KEMNAKER RI)", {
    x: margin,
    y: currentY,
    size: 10,
    font: fontBold,
    color: navyColor,
  });
  currentY -= 6;

  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: margin + contentWidth, y: currentY },
    thickness: 1,
    color: lineBorder,
  });
  currentY -= 14;

  const isOfficialFound = Boolean(data.officialCheck?.found);
  const officialStatusText = isOfficialFound
    ? `TERVERIFIKASI RESMI: Terdaftar di basis data Kemnaker RI (${data.officialCheck?.p3miName || "-"}) dengan status izin: ${data.officialCheck?.licenseStatus || "Aktif"}.`
    : `TIDAK DITEMUKAN: Entitas tidak terdaftar dalam basis data resmi Pelaksana Penempatan Pekerja Migran Indonesia (P3MI) berizin Kementerian Ketenagakerjaan RI.`;

  const offLines = wrapText(officialStatusText, contentWidth - 16, fontBold, 8.5);
  for (const l of offLines) {
    page.drawText(l, {
      x: margin + 6,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: isOfficialFound ? rgb(0.09, 0.5, 0.25) : rgb(0.75, 0.1, 0.1),
    });
    currentY -= 12;
  }

  // Legal notice for official check (FR-RSM-04)
  const fsm04Text =
    "Catatan Kepatuhan: Status 'tidak ditemukan' pada basis data resmi bukan bukti bahwa suatu perusahaan otomatis ilegal/kriminal, melainkan menunjukkan ketiadaan jaminan pelindungan hukum ketenagakerjaan resmi dari negara RI.";
  const fsmLines = wrapText(fsm04Text, contentWidth - 16, fontOblique, 7.5);
  for (const fl of fsmLines) {
    page.drawText(fl, {
      x: margin + 6,
      y: currentY,
      size: 7.5,
      font: fontOblique,
      color: mutedColor,
    });
    currentY -= 10;
  }
  currentY -= 10;

  // --- TEMUAN INDIKATOR RED FLAG & DASAR HUKUM ---
  if (data.redFlags && data.redFlags.length > 0) {
    checkSpace(40);
    page.drawText("IV. DAFTAR TEMUAN RED FLAG & RUJUKAN YURIDIS", {
      x: margin,
      y: currentY,
      size: 10,
      font: fontBold,
      color: navyColor,
    });
    currentY -= 6;

    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: margin + contentWidth, y: currentY },
      thickness: 1,
      color: lineBorder,
    });
    currentY -= 14;

    for (let i = 0; i < data.redFlags.length; i++) {
      const flag = data.redFlags[i];
      const flagSev = flag.severity === "bahaya" ? "BAHAYA" : "WASPADA";
      const flagSevColor = flag.severity === "bahaya" ? rgb(0.8, 0.1, 0.1) : rgb(0.8, 0.45, 0.05);

      checkSpace(45);

      // Flag Header
      page.drawText(`${i + 1}. [${flagSev}] ${flag.label} (${flag.code})`, {
        x: margin + 6,
        y: currentY,
        size: 9,
        font: fontBold,
        color: flagSevColor,
      });
      currentY -= 12;

      // Reason
      const reasonLines = wrapText(`Indikasi: ${flag.reason}`, contentWidth - 20, fontRegular, 8);
      for (const rl of reasonLines) {
        checkSpace(12);
        page.drawText(rl, {
          x: margin + 14,
          y: currentY,
          size: 8,
          font: fontRegular,
          color: darkInk,
        });
        currentY -= 11;
      }

      // Legal Basis
      if (flag.legal_basis) {
        checkSpace(12);
        page.drawText(`Dasar Hukum: ${flag.legal_basis}`, {
          x: margin + 14,
          y: currentY,
          size: 7.5,
          font: fontOblique,
          color: navyColor,
        });
        currentY -= 12;
      }
      currentY -= 4;
    }
  }

  // --- DISCLAIMER & STEMPEL HUKUM (Wajib FR-LOK-09) ---
  checkSpace(85);
  currentY -= 6;

  page.drawRectangle({
    x: margin,
    y: currentY - 70,
    width: contentWidth,
    height: 70,
    color: rgb(0.97, 0.98, 1.0),
    borderColor: rgb(0.78, 0.84, 0.95),
    borderWidth: 1,
  });

  page.drawText("PERNYATAAN RESMI KEPATUHAN & BATASAN TEKNOLOGI (DISCLAIMER):", {
    x: margin + 10,
    y: currentY - 14,
    size: 7.5,
    font: fontBold,
    color: navyColor,
  });

  const fullDisclaimer =
    "Hasil analisis ini dibuat secara otomatis oleh model kecerdasan buatan (AI Analysis Service) berdasarkan pola indikasi risiko. Analisis ini merupakan alat bantu penilaian awal (preliminary risk assessment) dan bukan merupakan putusan hukum resmi atau jaminan mutlak. Dokumen ini dapat dilampirkan sebagai bahan rujukan awal dalam pelaporan ke pihak berwajib (Polri / Satgas TPPO / BP2MI / Kemnaker RI).";

  const discLines = wrapText(fullDisclaimer, contentWidth - 20, fontRegular, 7);
  let discY = currentY - 26;
  for (const dl of discLines) {
    page.drawText(dl, {
      x: margin + 10,
      y: discY,
      size: 7,
      font: fontRegular,
      color: mutedColor,
    });
    discY -= 9;
  }

  // Watermark footer verification text
  page.drawText(`Kode Integritas Dokumen: SHA256-${Date.now().toString(16).toUpperCase()} | CekLoker 2026`, {
    x: margin + 10,
    y: currentY - 64,
    size: 6.5,
    font: fontRegular,
    color: mutedColor,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

