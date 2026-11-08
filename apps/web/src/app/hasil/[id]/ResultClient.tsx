"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Flag,
  RotateCcw,
  Building2,
  MapPin,
  Banknote,
  Phone,
  FileText,
  AlertOctagon,
  ExternalLink,
  ShieldAlert,
  Loader2,
  AlertCircle,
  ShieldCheck,
  TriangleAlert,
  Ban,
  Archive,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RiskBadge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { PosterAnnotator } from "@/components/result/PosterAnnotator";
import { RedFlagList } from "@/components/result/RedFlagList";
import { FeedbackModal } from "@/components/result/FeedbackModal";
import type { AnalysisResult, RedFlag } from "@/types";
import type { StoredScan } from "@/lib/store";

interface OfficialCheckUI {
  found: boolean;
  p3mi_name?: string;
  sip2mi_code?: string;
  license_status?: string;
  countries?: string[];
  job_types?: string[];
  is_exact?: boolean;
  similarity_score?: number;
  detail: string;
  link: string;
}

interface ScamMatchItemUI {
  posterId?: string;
  jobTitle?: string;
  companyName?: string;
  destination?: string;
  reportCount?: number;
  distance?: number;
  similarityPercent?: number;
}

interface ScamDetailsUI {
  matched?: boolean;
  matchedCount?: number;
  bestDistance?: number | null;
  bestSimilarity?: number | null;
  findingLabel?: string | null;
  matches?: ScamMatchItemUI[];
}

interface DatasetItem {
  name: string;
  image: string;
  official_check: OfficialCheckUI;
  scam_matches: number;
  scam_details?: ScamDetailsUI;
  result: AnalysisResult;
}

// Preset evaluation datasets from services/ai evaluation
const PRESET_DATASETS: Record<string, DatasetItem> = {
  kamboja: {
    name: "Contoh 1: CS Kamboja (Bahaya TPPO)",
    image: "/img/scam_kamboja.png",
    scam_matches: 4,
    scam_details: {
      matched: true,
      matchedCount: 4,
      bestDistance: 0,
      bestSimilarity: 100,
      findingLabel: "Cocok dengan 4 laporan penipuan terverifikasi",
      matches: [
        {
          jobTitle: "Customer Service Online Phnom Penh",
          companyName: "Anonim / Sindikat Penipuan Daring Kamboja",
          destination: "Phnom Penh, Kamboja",
          reportCount: 4,
          distance: 0,
          similarityPercent: 100,
        },
      ],
    },
    official_check: {
      found: false,
      detail:
        "Nama perusahaan tidak ditemukan pada data resmi P3MI Kementerian Ketenagakerjaan maupun SISKOP2MI BP2MI.",
      link: "https://siskop2mi.bp2mi.go.id/",
    },
    result: {
      schema_version: "1.0",
      input_type: "lowongan",
      risk_level: "bahaya",
      confidence: 0.95,
      needs_manual_check: false,
      summary:
        "Lowongan ini memiliki indikator bahaya kritis yang mengarah kuat pada sindikat daring penipuan dan Tindak Pidana Perdagangan Orang (TPPO). Ditemukan desakan berangkat kilat, penahanan paspor, dan penggunaan visa turis tanpa kontrak resmi ketenagakerjaan.",
      extracted: {
        position: "CUSTOMER SERVICE ONLINE",
        company: "Tidak Ditemukan",
        country: "Phnom Penh, KAMBOJA",
        salary: "USD 1.500 + BONUS",
        fees: "Rp 2.500.000 (di muka)",
        contact: ["Telegram @kerja_luarnegeri_cepat", "WA Pak Andi"],
        requirements: [
          "SMA/SMK sederajat",
          "Tanpa pengalaman kerja",
          "Usia 18-30 tahun",
          "Siap kerja sistem shift",
        ],
      },
      red_flags: [
        {
          code: "paspor_ditahan",
          label: "Penahanan paspor",
          severity: "bahaya",
          quote: "Paspor dititipkan ke agen untuk proses visa kunjungan.",
          reason:
            "Perekrut meminta paspor asli calon pekerja dititipkan kepada agen selama masa penempatan.",
          legal_basis: "UU No. 21 Tahun 2007 (TPPO) & UU No. 18/2017 Pasal 68",
          regions: [
            {
              image_index: 0,
              bbox: { x: 0.064, y: 0.398, w: 0.642, h: 0.05 },
            },
          ],
        },
        {
          code: "visa_turis",
          label: "Visa turis untuk bekerja",
          severity: "bahaya",
          quote: "Berangkat memakai visa kunjungan wisata, izin kerja diurus di Kamboja.",
          reason:
            "Bekerja menggunakan visa wisata adalah pelanggaran pidana imigrasi serius dan menghilangkan perlindungan negara.",
          legal_basis: "UU No. 18 Tahun 2017 tentang Pelindungan PMI",
          regions: [
            {
              image_index: 0,
              bbox: { x: 0.064, y: 0.485, w: 0.72, h: 0.05 },
            },
          ],
        },
        {
          code: "gaji_tidak_wajar",
          label: "Gaji tidak wajar",
          severity: "waspada",
          quote: "Gaji pokok USD 1.500 (Rp24 jt) tanpa syarat keahlian khusus.",
          reason:
            "Nominal upah jauh melampaui standar pasaran untuk posisi entri tanpa keahlian khusus.",
          legal_basis: "Katalog Indikasi Penipuan Rekrutmen Tenaga Kerja",
          regions: [
            {
              image_index: 0,
              bbox: { x: 0.064, y: 0.28, w: 0.58, h: 0.045 },
            },
          ],
        },
      ],
      fingerprint: {
        image_phash: ["f0e1d2c3b4a59687"],
        raw_text:
          "Dibutuhkan Customer Service Online Phnom Penh Gaji USD 1500 Visa Kunjungan Paspor dititipkan",
        normalized_text:
          "dibutuhkan customer service online phnom penh gaji usd 1500 visa kunjungan paspor dititipkan",
      },
      meta: {
        model: "gemini-3.8-flash",
        prompt_version: "v1.0",
        catalog_version: "1.0.0",
        normalization_version: "1",
        risk_score: 10,
        latency_ms: 1420,
      },
    },
  },
  jepang: {
    name: "Contoh 2: Perawat Jepang (Resmi P3MI Aman)",
    image: "/img/asli_p3mi.png",
    scam_matches: 0,
    official_check: {
      found: true,
      p3mi_name: "PT OS SELNAJAYA INDONESIA",
      sip2mi_code: "SIP2MI-JPN-2026-0812",
      license_status: "Aktif",
      countries: ["Jepang"],
      job_types: ["Caregiver (Perawat Lansia)", "Manufaktur"],
      is_exact: true,
      similarity_score: 1.0,
      detail:
        "Perusahaan terdaftar aktif sebagai P3MI berizin resmi pada basis data BP2MI dan Kemnaker RI.",
      link: "https://siskop2mi.bp2mi.go.id/",
    },
    result: {
      schema_version: "1.0",
      input_type: "lowongan",
      risk_level: "aman",
      confidence: 0.98,
      needs_manual_check: false,
      summary:
        "Lowongan ini memenuhi standar rekrutmen pekerja migran resmi melalui skema Specified Skilled Worker (SSW) atau G-to-G. Cantuman nomor izin P3MI valid dan tidak ditemukan pungutan liar.",
      extracted: {
        position: "Caregiver (Perawat Lansia SSW)",
        company: "PT OS Selnajaya Indonesia (P3MI Resmi)",
        country: "Tokyo / Osaka, JEPANG",
        salary: "JPY 210.000 (~Rp 22.000.000/bln)",
        fees: "Nol Biaya Penempatan (Zero Cost)",
        contact: ["recruitment@selnajaya.com", "021-5080-8888"],
        requirements: [
          "D3/S1 Keperawatan",
          "Sertifikat JLPT N4 / JFT-Basic",
          "Lulus tes skill caregiver Prometric",
        ],
      },
      red_flags: [],
      fingerprint: {
        image_phash: ["1234567890abcdef"],
        raw_text:
          "Program Penempatan Perawat Lansia Jepang PT OS Selnajaya SIP2MI JPN 2026",
        normalized_text:
          "program penempatan perawat lansia jepang pt os selnajaya sip2mi jpn 2026",
      },
      meta: {
        model: "gemini-3.8-flash",
        prompt_version: "v1.0",
        catalog_version: "1.0.0",
        normalization_version: "1",
        risk_score: 0,
        latency_ms: 1100,
      },
    },
  },
  taiwan: {
    name: "Contoh 3: Pabrik Taiwan (Waspada Biaya)",
    image: "/img/scam_taiwan.png",
    scam_matches: 1,
    scam_details: {
      matched: true,
      matchedCount: 1,
      bestDistance: 4,
      bestSimilarity: 94,
      findingLabel: "Cocok dengan 1 laporan penipuan terverifikasi",
      matches: [
        {
          jobTitle: "Operator Pabrik Elektronik Taiwan",
          companyName: "PT Taiwan Mandiri Jaya (Pungutan Biaya Di Muka)",
          destination: "Taichung, Taiwan",
          reportCount: 1,
          distance: 4,
          similarityPercent: 94,
        },
      ],
    },
    official_check: {
      found: true,
      p3mi_name: "PT TAIWAN MANDIRI JAYA",
      sip2mi_code: "SIP2MI-TWN-2025-0144",
      license_status: "Aktif",
      countries: ["Taiwan"],
      job_types: ["Operator Pabrik Elektronik", "Manufaktur Logam"],
      is_exact: true,
      similarity_score: 1.0,
      detail:
        "Perusahaan terdaftar, namun ditemukan klausa potongan gaji dan biaya proses di muka yang melebihi standar ketentuan Kemnaker.",
      link: "https://siskop2mi.bp2mi.go.id/",
    },
    result: {
      schema_version: "1.0",
      input_type: "lowongan",
      risk_level: "waspada",
      confidence: 0.88,
      needs_manual_check: false,
      summary:
        "Perusahaan penempatan memiliki izin P3MI, namun brosur mencantumkan biaya administrasi di muka yang tidak transparan dan ancaman penahanan ijazah jika mengundurkan diri.",
      extracted: {
        position: "Operator Pabrik Elektronik",
        company: "PT Taiwan Mandiri Jaya",
        country: "Taichung, TAIWAN",
        salary: "NT$ 27.470 (Sesuai UMR)",
        fees: "Biaya proses awal Rp 12.000.000",
        contact: ["wa.me/6281399887766"],
        requirements: ["Usia 20-35", "Tinggi badan min 160 cm", "Ijazah asli ditahan"],
      },
      red_flags: [
        {
          code: "biaya_di_muka",
          label: "Biaya proses awal tidak transparan",
          severity: "waspada",
          quote: "Wajib membayar DP Rp 12 juta sebelum jadwal medical check-up keluar.",
          reason:
            "Permintaan biaya di muka sebelum kontrak kerja ditandatangani berpotensi menjebak calon pekerja dalam jeratan utang.",
          legal_basis: "Peraturan BP2MI No. 09 Tahun 2020 tentang Pembebasan Biaya",
          regions: [
            {
              image_index: 0,
              bbox: { x: 0.1, y: 0.52, w: 0.65, h: 0.05 },
            },
          ],
        },
      ],
      fingerprint: {
        image_phash: ["abcdef1234567890"],
        raw_text: "Lowongan Pabrik Elektronik Taiwan DP 12 Juta PT Taiwan Mandiri Jaya",
        normalized_text:
          "lowongan pabrik elektronik taiwan dp 12 juta pt taiwan mandiri jaya",
      },
      meta: {
        model: "gemini-3.8-flash",
        prompt_version: "v1.0",
        catalog_version: "1.0.0",
        normalization_version: "1",
        risk_score: 4,
        latency_ms: 1250,
      },
    },
  },
};

interface ResultClientProps {
  id: string;
}

export default function ResultClient({ id: rawId }: ResultClientProps) {
  const [selectedKey, setSelectedKey] = useState<string>(
    PRESET_DATASETS[rawId] || rawId === "demo" ? (rawId === "demo" ? "kamboja" : rawId) : "custom"
  );
  const [activeFlagCode, setActiveFlagCode] = useState<string | null>(null);
  const [feedbackFlag, setFeedbackFlag] = useState<RedFlag | null>(null);

  // State untuk scan dinamis dari server
  const [dynamicScan, setDynamicScan] = useState<StoredScan | null>(null);
  const [loading, setLoading] = useState<boolean>(!PRESET_DATASETS[rawId] && rawId !== "demo");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Jika ID adalah preset statis, tidak perlu fetch
    if (PRESET_DATASETS[rawId] || rawId === "demo") {
      setSelectedKey(rawId === "demo" ? "kamboja" : rawId);
      setLoading(false);
      return;
    }

    // Ambil data scan nyata dari API /api/scan/[id]
    async function fetchScan() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/scan/${rawId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Data pemeriksaan tidak ditemukan atau telah kedaluwarsa.");
        }
        const scanData: StoredScan = await res.json();
        setDynamicScan(scanData);
        setSelectedKey("custom");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Gagal memuat hasil pemeriksaan.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    fetchScan();
  }, [rawId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-canvas py-16">
          <div className="container-page max-w-2xl text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 text-navy animate-spin" />
            <h2 className="text-xl font-bold text-ink">Memuat Hasil Pemeriksaan...</h2>
            <p className="text-sm text-muted">
              Menghubungkan visualisasi anotasi red flag dan verifikasi jalur resmi.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || (selectedKey === "custom" && !dynamicScan)) {
    return (
      <>
        <Navbar />
        <main className="flex-1 bg-canvas py-16">
          <div className="container-page max-w-lg text-center space-y-4">
            <div className="card p-8 bg-white shadow-card space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-bahaya stroke-[2]" />
              <h2 className="text-xl font-bold text-ink">Hasil Tidak Ditemukan</h2>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
                {error ?? "Sesi pemeriksaan tamu telah melewati batas retensi 24 jam atau tautan tidak valid."}
              </p>
              <div className="pt-2">
                <Link href="/cekloker" className="btn btn-primary w-full">
                  Periksa Lowongan Baru
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Pilih dataset aktif: dinamis dari server atau salah satu preset
  const currentDataset =
    selectedKey === "custom" && dynamicScan
      ? {
          name: "Hasil Pemeriksaan Anda",
          image: dynamicScan.imageUrl || "/img/scam_kamboja.png",
          official_check: {
            found: dynamicScan.officialCheck.found,
            p3mi_name: dynamicScan.officialCheck.p3miName,
            sip2mi_code: dynamicScan.officialCheck.sip2miCode,
            license_status: dynamicScan.officialCheck.licenseStatus,
            countries: dynamicScan.officialCheck.countries,
            job_types: dynamicScan.officialCheck.jobTypes,
            is_exact: dynamicScan.officialCheck.isExact,
            similarity_score: dynamicScan.officialCheck.similarityScore,
            detail: dynamicScan.officialCheck.detail,
            link: dynamicScan.officialCheck.link,
          },
          scam_matches: dynamicScan.scamMatches,
          scam_details: dynamicScan.scamDetails as ScamDetailsUI | undefined,
          result: dynamicScan.result,
        }
      : PRESET_DATASETS[selectedKey] ?? PRESET_DATASETS.kamboja;

  const { result, image, official_check, scam_matches, scam_details } = currentDataset;

  const riskInfo = {
    bahaya: {
      label: "Bahaya",
      bg: "bg-[#b91c1c]",
      icon: ShieldAlert,
    },
    waspada: {
      label: "Waspada",
      bg: "bg-[#b45309]",
      icon: TriangleAlert,
    },
    aman: {
      label: "Aman",
      bg: "bg-[#15803d]",
      icon: ShieldCheck,
    },
  }[result.risk_level] ?? {
    label: "Bahaya",
    bg: "bg-[#b91c1c]",
    icon: ShieldAlert,
  };

  const RiskBannerIcon = riskInfo.icon;

  const recommendationSteps =
    result.risk_level === "bahaya"
      ? [
          {
            title: "Hentikan komunikasi",
            desc: "Jangan mentransfer uang atau menyerahkan dokumen asli (paspor/ijazah) kepada perekrut ini.",
            border: "border-red-500",
            textColor: "text-red-500",
            icon: Ban,
          },
          {
            title: "Laporkan",
            desc: "Gunakan kanal pengaduan resmi Satgas TPPO Polri atau BP2MI jika diminta berangkat dengan visa turis.",
            border: "border-blue-600",
            textColor: "text-blue-600",
            icon: Flag,
          },
          {
            title: "Simpan bukti",
            desc: "Amankan tangkapan layar percakapan dan bukti pembayaran untuk proses hukum.",
            border: "border-emerald-600",
            textColor: "text-emerald-600",
            icon: Archive,
          },
        ]
      : result.risk_level === "waspada"
      ? [
          {
            title: "Verifikasi langsung",
            desc: "Hubungi kontak resmi perusahaan untuk memastikan nama perekrut benar-benar terdaftar.",
            border: "border-amber-500",
            textColor: "text-amber-600",
            icon: Building2,
          },
          {
            title: "Tolak pungutan liar",
            desc: "Rekrutmen resmi tidak membebankan biaya tiket/pelatihan di muka tanpa rincian perjanjian kerja resmi.",
            border: "border-red-500",
            textColor: "text-red-500",
            icon: Ban,
          },
          {
            title: "Simpan bukti",
            desc: "Amankan tangkapan layar percakapan dan berkas penawaran untuk verifikasi lebih lanjut.",
            border: "border-emerald-600",
            textColor: "text-emerald-600",
            icon: Archive,
          },
        ]
      : [
          {
            title: "Tetap cermat",
            desc: "Pastikan Anda menandatangani Perjanjian Kerja (PK) yang disahkan oleh instansi resmi.",
            border: "border-blue-600",
            textColor: "text-blue-600",
            icon: ShieldCheck,
          },
          {
            title: "Kroscek visa & izin",
            desc: "Pastikan jenis visa yang diterbitkan adalah visa kerja resmi (bukan visa wisata/kunjungan).",
            border: "border-emerald-600",
            textColor: "text-emerald-600",
            icon: CheckCircle2,
          },
          {
            title: "Simpan kontak darurat",
            desc: "Catat nomor call center ketenagakerjaan atau perwakilan resmi sebelum memulai pekerjaan.",
            border: "border-amber-500",
            textColor: "text-amber-600",
            icon: Archive,
          },
        ];

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas pt-4 sm:pt-6 pb-8 sm:pb-12">
        {/* Cap air saat dicetak via browser print (FR-HSL-02) */}
        <div className="watermark-print hidden print:block" aria-hidden="true">
          DOKUMEN EVALUASI RESMI CEKLOKER — HANYA UNTUK PELAPORAN
        </div>
        <div className="container-page space-y-6">
          {/* Kartu Ringkasan Hasil Utama */}
          <div className="card !p-0 bg-white shadow-card overflow-hidden flex flex-col md:flex-row items-stretch">
            {/* Panel Status Kiri (Sesuai Desain Mockup) */}
            <div
              className={`w-full md:w-60 lg:w-64 p-6 sm:p-7 flex flex-col justify-between shrink-0 text-white ${riskInfo.bg}`}
            >
              <div>
                <RiskBannerIcon className="h-10 w-10 text-white stroke-[2.2]" />
              </div>

              <div className="mt-8 md:mt-0">
                <h2
                  className="text-3xl font-extrabold !text-white tracking-tight leading-tight"
                  style={{ color: "#ffffff" }}
                >
                  {riskInfo.label}
                </h2>
                <p
                  className="mt-1 text-xs sm:text-sm font-medium !text-white/90"
                  style={{ color: "rgba(255, 255, 255, 0.9)" }}
                >
                  Tingkat keyakinan AI: {Math.round(result.confidence * 100)}%
                </p>
              </div>
            </div>

            {/* Konten Kanan */}
            <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-2xl sm:text-[26px] font-extrabold text-ink tracking-tight">
                    Hasil Pemeriksaan Lowongan
                  </h1>
                  {scam_matches > 0 && (
                    <span className="text-xs font-semibold text-bahaya-ink bg-bahaya-tint px-2.5 py-0.5 rounded-full border border-bahaya-line shrink-0">
                      Cocok dengan {scam_matches} laporan penipuan
                    </span>
                  )}
                </div>

                <p
                  className="text-sm sm:text-base text-slate-700 leading-relaxed text-justify"
                  style={{ textAlign: "justify" }}
                >
                  {result.summary}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 no-print pt-2">
                <a
                  href={`/api/scan/${selectedKey !== "custom" ? selectedKey : rawId}/pdf`}
                  download
                  className="btn btn-secondary btn-sm cursor-pointer"
                  title="Unduh berkas PDF formal dengan cap air resmi CekLoker"
                >
                  <Download className="h-4 w-4" />
                  <span>Unduh PDF</span>
                </a>
                <Link
                  href={`/lapor?scan_id=${rawId}`}
                  className="btn btn-secondary btn-sm !text-bahaya-ink !border-bahaya-line hover:!bg-bahaya-tint cursor-pointer"
                >
                  <Flag className="h-4 w-4" />
                  <span>Laporkan Loker</span>
                </Link>
                <Link href="/cekloker" className="btn btn-primary btn-sm cursor-pointer">
                  <RotateCcw className="h-4 w-4" />
                  <span>Cek Lainnya</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Grid Layout 2 Kolom: Kiri Poster Anotasi, Kanan Informasi & Temuan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Visual Poster & Anotasi Bounding Box (5/12) */}
            <div className="lg:col-span-5 sticky top-20">
              <PosterAnnotator
                imageSrc={image}
                imageAlt={result.extracted?.position ?? "Poster lowongan"}
                redFlags={result.red_flags ?? []}
                activeCode={activeFlagCode}
                onSelectFlag={(code) => setActiveFlagCode(code)}
              />
            </div>

            {/* Kolom Kanan: Rincian Red Flags & Verifikasi Resmi (7/12) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Informasi Lowongan Diekstrak */}
              <div className="card p-5 bg-white space-y-4">
                <h3 className="font-bold text-base text-ink flex items-center gap-2">
                  <FileText className="h-4 w-4 text-navy" />
                  <span>Informasi Lowongan Diekstrak</span>
                </h3>

                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Building2 className="h-4 w-4 shrink-0 text-muted" />
                    <span>Perusahaan:</span>
                    <strong className="text-ink ml-auto">
                      {!result.extracted?.company ||
                      result.extracted.company === "-" ||
                      result.extracted.company.toLowerCase().includes("tidak dicantumkan")
                        ? "Tidak Ditemukan"
                        : result.extracted.company}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0 text-muted" />
                    <span>Lokasi:</span>
                    <strong className="text-ink ml-auto">
                      {result.extracted?.country ?? "-"}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Banknote className="h-4 w-4 shrink-0 text-muted" />
                    <span>Gaji:</span>
                    <strong className="text-ink ml-auto">
                      {result.extracted?.salary ?? "-"}
                    </strong>
                  </div>
                  {result.extracted?.fees && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <AlertOctagon className="h-4 w-4 shrink-0 text-bahaya-ink" />
                      <span>Biaya Diminta:</span>
                      <strong className="text-bahaya-ink ml-auto">
                        {result.extracted.fees}
                      </strong>
                    </div>
                  )}
                  {result.extracted?.contact && result.extracted.contact.length > 0 && (
                    <div className="flex items-start gap-2 text-slate-600 pt-1">
                      <Phone className="h-4 w-4 shrink-0 text-muted mt-0.5" />
                      <span>Kontak:</span>
                      <span className="text-ink ml-auto text-right font-medium">
                        {result.extracted.contact.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Notifikasi Pencocokan Poster Scam Terverifikasi (M4 - FR-PST-01 s/d 03) */}
              {scam_matches > 0 && (
                <div className="card p-5 bg-white border border-bahaya-line space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="font-bold text-base text-ink flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5 text-bahaya" />
                      <span>Pencocokan Poster Scam (dHash 64-bit)</span>
                    </h3>
                    <span className="badge badge-bahaya">
                      Mirip {scam_matches} Laporan Penipuan
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    Sistem mendeteksi kemiripan visual tinggi (selisih bit &le; 10) antara poster yang diunggah dengan arsip poster penipuan yang telah diverifikasi oleh tim peninjau CekLoker.
                  </p>

                  {scam_details?.matches && scam_details.matches.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-semibold text-muted">Laporan Terverifikasi Terkait:</div>
                      <div className="space-y-1.5">
                        {scam_details.matches.map((m, idx) => (
                          <div
                            key={idx}
                            className="rounded bg-bahaya-tint/60 border border-bahaya-line/60 p-2.5 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                          >
                            <div>
                              <strong className="text-bahaya-ink">{m.jobTitle || "Lowongan Terindikasi"}</strong>
                              <span className="text-muted ml-1.5">({m.companyName || "Anonim"})</span>
                              {m.destination && (
                                <span className="text-slate-600 ml-1.5">&bull; {m.destination}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {m.distance !== undefined && (
                                <span className="font-mono bg-white px-2 py-0.5 rounded border text-[11px] text-slate-600">
                                  Jarak: {m.distance}/64 bit
                                </span>
                              )}
                              {m.similarityPercent !== undefined && (
                                <span className="font-bold text-bahaya-ink text-[11px]">
                                  Kemiripan {m.similarityPercent}%
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verifikasi Sumber Resmi Pemerintah (BP2MI / Kemnaker - FR-RSM-01 s/d 04) */}
              <div className="card !p-0 bg-white shadow-card rounded-2xl overflow-hidden divide-y divide-slate-100 border border-line">
                {/* Header Card */}
                <div className="px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between gap-3">
                  <h3 className="font-bold text-sm sm:text-base text-ink flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-ink shrink-0" />
                    <span>Pengecekan sumber resmi</span>
                  </h3>
                  <span
                    className={cn(
                      "font-semibold text-xs px-2.5 py-0.5 rounded-md border",
                      official_check.found
                        ? "bg-emerald-100/80 text-emerald-900 border-emerald-200/60"
                        : "bg-amber-100/80 text-amber-900 border-amber-200/60"
                    )}
                  >
                    {official_check.found ? "Ditemukan resmi" : "Tidak ditemukan"}
                  </span>
                </div>

                {/* Baris 1: Nama dicari */}
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between sm:justify-start gap-0.5 sm:gap-4 text-xs sm:text-sm">
                  <span className="w-36 sm:w-44 shrink-0 text-slate-500 font-medium">
                    Nama dicari
                  </span>
                  <span className="font-semibold text-ink">
                    {result.extracted?.company &&
                    result.extracted.company !== "-" &&
                    !result.extracted.company.toLowerCase().includes("tidak dicantumkan")
                      ? result.extracted.company
                      : official_check.p3mi_name || "Tidak dicantumkan"}
                  </span>
                </div>

                {/* Baris 2: P3MI Kemnaker */}
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between sm:justify-start gap-0.5 sm:gap-4 text-xs sm:text-sm">
                  <span className="w-36 sm:w-44 shrink-0 text-slate-500 font-medium">
                    P3MI Kemnaker
                  </span>
                  <span className="font-semibold text-ink">
                    {official_check.found
                      ? official_check.license_status
                        ? `Terdaftar (${official_check.license_status})`
                        : "Terdaftar Resmi"
                      : "Tidak ditemukan"}
                  </span>
                </div>

                {/* Baris 3: SISKOP2MI BP2MI */}
                <div className="px-4 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between sm:justify-start gap-0.5 sm:gap-4 text-xs sm:text-sm">
                  <span className="w-36 sm:w-44 shrink-0 text-slate-500 font-medium">
                    SISKOP2MI BP2MI
                  </span>
                  <span className="font-semibold text-ink">
                    {official_check.found
                      ? official_check.sip2mi_code
                        ? `Terdaftar (${official_check.sip2mi_code})`
                        : "Terdaftar Resmi"
                      : "Tidak ditemukan"}
                  </span>
                </div>

                {/* Baris Opsional Jika Resmi & Ada Data Tambahan */}
                {official_check.found && official_check.countries && official_check.countries.length > 0 && (
                  <div className="px-4 sm:px-5 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between sm:justify-start gap-0.5 sm:gap-4 text-xs sm:text-sm">
                    <span className="w-36 sm:w-44 shrink-0 text-slate-500 font-medium">
                      Negara Penempatan
                    </span>
                    <span className="font-semibold text-ink">
                      {official_check.countries.join(", ")}
                    </span>
                  </div>
                )}

                {/* Notifikasi Toleran Salah Ketik */}
                {!official_check.is_exact && official_check.similarity_score !== undefined && (
                  <div className="px-4 sm:px-5 py-2 bg-amber-50/60 text-[11px] text-amber-900 italic">
                    * Pencarian toleran salah ketik: terdeteksi kecocokan fonetik/ejaan dengan kemiripan{" "}
                    {Math.round(official_check.similarity_score * 100)}%.
                  </div>
                )}

                {/* Footer Link & Call Center */}
                <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <a
                    href={official_check.link || "https://siskop2mi.bp2mi.go.id/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-navy hover:underline underline"
                  >
                    Periksa mandiri di SISKOP2MI
                  </a>
                  <span className="text-slate-600">
                    Call Center BP2MI: <strong className="font-bold text-ink">1500–117</strong> (24 jam)
                  </span>
                </div>
              </div>

              {/* Daftar Red Flag Interaktif */}
              <RedFlagList
                redFlags={result.red_flags ?? []}
                activeCode={activeFlagCode}
                onSelectFlag={(code) => setActiveFlagCode(code)}
                onOpenFeedback={(flag) => setFeedbackFlag(flag)}
              />

            </div>
          </div>

          {/* Rekomendasi Tindakan Keamanan (Melebar Penuh / Full Width) */}
          <div className="card p-6 sm:p-8 bg-white shadow-card rounded-2xl border border-line space-y-6">
            <h3 className="font-bold text-base sm:text-lg text-ink text-center">
              Rekomendasi Tindakan Keamanan
            </h3>

            <div className="relative">
              {/* Garis Putus-Putus Penghubung (Desktop) */}
              <div
                className="hidden md:block absolute top-7 left-16 right-16 border-t-2 border-dashed border-slate-200 z-0"
                aria-hidden="true"
              />

              {/* 3 Langkah Horizontal Melebar Penuh */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 relative z-10">
                {recommendationSteps.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div
                        className={cn(
                          "h-14 w-14 rounded-full bg-white border-2 flex items-center justify-center shadow-xs transition-transform hover:scale-105",
                          step.border
                        )}
                      >
                        <StepIcon className={cn("h-6 w-6 stroke-[2]", step.textColor)} />
                      </div>
                      <h4 className="mt-3.5 font-bold text-sm sm:text-base text-ink">
                        {step.title}
                      </h4>
                      <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                        {step.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Disclaimer Kontekstual */}
          <DisclaimerBanner />
        </div>
      </main>

      <Footer />

      {/* Modal Sanggahan Hasil AI (FR-LPR-03) */}
      <FeedbackModal
        flag={feedbackFlag}
        isOpen={feedbackFlag !== null}
        onClose={() => setFeedbackFlag(null)}
      />
    </>
  );
}

