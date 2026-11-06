"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Printer,
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
  Info,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { RiskBadge } from "@/components/ui/Badge";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { PosterAnnotator } from "@/components/result/PosterAnnotator";
import { RedFlagList } from "@/components/result/RedFlagList";
import { FeedbackModal } from "@/components/result/FeedbackModal";
import type { AnalysisResult, RedFlag } from "@/types";

// Preset evaluation datasets from services/ai evaluation
const PRESET_DATASETS: Record<
  string,
  {
    name: string;
    image: string;
    official_check: {
      found: boolean;
      p3mi_name?: string;
      sip2mi_code?: string;
      detail: string;
      link: string;
    };
    scam_matches: number;
    result: AnalysisResult;
  }
> = {
  kamboja: {
    name: "Contoh 1: CS Kamboja (Bahaya TPPO)",
    image: "/img/scam_kamboja.png",
    scam_matches: 4,
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
        company: "Tidak Dicantumkan (Anonim)",
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
    official_check: {
      found: true,
      p3mi_name: "PT TAIWAN MANDIRI JAYA",
      sip2mi_code: "SIP2MI-TWN-2025-0144",
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

export default function ResultPage() {
  const [selectedKey, setSelectedKey] = useState<string>("kamboja");
  const [activeFlagCode, setActiveFlagCode] = useState<string | null>(null);
  const [feedbackFlag, setFeedbackFlag] = useState<RedFlag | null>(null);

  const currentDataset = PRESET_DATASETS[selectedKey] ?? PRESET_DATASETS.kamboja;
  const { result, image, official_check, scam_matches } = currentDataset;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-canvas py-8 sm:py-12">
        <div className="container-page space-y-6">
          {/* Preset Selector Bar (Pengujian Prototipe) */}
          <div className="card p-3 bg-white flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
              <span className="eyebrow !text-xs">Uji Sampel Evaluasi:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESET_DATASETS).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  className={`btn btn-xs ${
                    selectedKey === key ? "btn-primary" : "btn-secondary"
                  } cursor-pointer`}
                  onClick={() => {
                    setSelectedKey(key);
                    setActiveFlagCode(null);
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* Kartu Ringkasan Hasil Utama */}
          <div className="card p-6 sm:p-8 bg-white shadow-card">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <RiskBadge status={result.risk_level} className="badge-lg" />
                  <span className="text-xs font-semibold text-muted bg-slate-100 px-3 py-1 rounded-full">
                    Tingkat Keyakinan AI: {Math.round(result.confidence * 100)}%
                  </span>
                  {scam_matches > 0 && (
                    <span className="text-xs font-semibold text-bahaya-ink bg-bahaya-tint px-3 py-1 rounded-full border border-bahaya-line">
                      Cocok dengan {scam_matches} laporan penipuan terverifikasi
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-ink">
                  Hasil Pemeriksaan Lowongan
                </h1>

                <p className="max-w-3xl text-sm sm:text-base text-slate-700 leading-relaxed">
                  {result.summary}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 shrink-0 no-print">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-secondary btn-sm cursor-pointer"
                  title="Cetak atau simpan sebagai PDF"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak PDF</span>
                </button>
                <Link
                  href="/lapor"
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

            {/* Disclaimer Kontekstual */}
            <div className="mt-6 pt-6 border-t border-line">
              <DisclaimerBanner />
            </div>
          </div>

          {/* Grid Layout 2 Kolom: Kiri Poster Anotasi, Kanan Informasi & Temuan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Visual Poster & Anotasi Bounding Box (5/12) */}
            <div className="lg:col-span-5 sticky top-20 space-y-6">
              <PosterAnnotator
                imageSrc={image}
                imageAlt={result.extracted.position ?? "Poster lowongan"}
                redFlags={result.red_flags}
                activeCode={activeFlagCode}
                onSelectFlag={(code) => setActiveFlagCode(code)}
              />

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
                      {result.extracted.company ?? "-"}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="h-4 w-4 shrink-0 text-muted" />
                    <span>Lokasi:</span>
                    <strong className="text-ink ml-auto">
                      {result.extracted.country ?? "-"}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Banknote className="h-4 w-4 shrink-0 text-muted" />
                    <span>Gaji:</span>
                    <strong className="text-ink ml-auto">
                      {result.extracted.salary ?? "-"}
                    </strong>
                  </div>
                  {result.extracted.fees && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <AlertOctagon className="h-4 w-4 shrink-0 text-bahaya-ink" />
                      <span>Biaya Diminta:</span>
                      <strong className="text-bahaya-ink ml-auto">
                        {result.extracted.fees}
                      </strong>
                    </div>
                  )}
                  {result.extracted.contact && result.extracted.contact.length > 0 && (
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
            </div>

            {/* Kolom Kanan: Rincian Red Flags & Verifikasi Resmi (7/12) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Verifikasi Sumber Resmi Pemerintah (BP2MI / Kemnaker) */}
              <div className="card p-5 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-ink flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-navy" />
                    <span>Pengecekan Sumber Resmi (BP2MI / Kemnaker)</span>
                  </h3>
                  <span
                    className={`badge ${
                      official_check.found ? "badge-aman" : "badge-waspada"
                    }`}
                  >
                    {official_check.found ? "Ditemukan Resmi" : "Tidak Ditemukan"}
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed">
                  {official_check.detail}
                </p>

                {official_check.p3mi_name && (
                  <div className="rounded bg-slate-50 p-3 text-xs text-slate-800 border border-slate-200">
                    <div>
                      <strong>Nama P3MI Terdaftar:</strong> {official_check.p3mi_name}
                    </div>
                    {official_check.sip2mi_code && (
                      <div className="mt-1">
                        <strong>Nomor Izin SIP2MI:</strong> {official_check.sip2mi_code}
                      </div>
                    )}
                  </div>
                )}

                {!official_check.found && (
                  <DisclaimerBanner variant="official_unfound" />
                )}

                <div className="pt-2">
                  <a
                    href={official_check.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:underline"
                  >
                    <span>Periksa mandiri di SISKOP2MI BP2MI</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Daftar Red Flag Interaktif */}
              <RedFlagList
                redFlags={result.red_flags}
                activeCode={activeFlagCode}
                onSelectFlag={(code) => setActiveFlagCode(code)}
                onOpenFeedback={(flag) => setFeedbackFlag(flag)}
              />

              {/* Rekomendasi Tindakan Keamanan */}
              <div className="card p-5 bg-white space-y-4">
                <h3 className="font-bold text-base text-ink flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-navy" />
                  <span>Rekomendasi Tindakan Keamanan</span>
                </h3>

                <ul className="space-y-2 text-sm text-slate-700">
                  {result.risk_level === "bahaya" ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-bahaya shrink-0 mt-2" />
                        <span>
                          <strong>Hentikan komunikasi:</strong> Jangan mentransfer uang atau menyerahkan dokumen asli (paspor/ijazah) kepada perekrut ini.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-bahaya shrink-0 mt-2" />
                        <span>
                          <strong>Laporkan:</strong> Gunakan kanal pengaduan resmi Satgas TPPO Polri atau BP2MI jika diminta berangkat dengan visa turis.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-bahaya shrink-0 mt-2" />
                        <span>
                          <strong>Simpan bukti:</strong> Amankan tangkapan layar percakapan dan bukti pembayaran untuk proses hukum.
                        </span>
                      </li>
                    </>
                  ) : result.risk_level === "waspada" ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-waspada shrink-0 mt-2" />
                        <span>
                          <strong>Verifikasi langsung:</strong> Hubungi kontak resmi perusahaan untuk memastikan nama perekrut benar-benar terdaftar.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-waspada shrink-0 mt-2" />
                        <span>
                          <strong>Tolak pungutan liar:</strong> Rekrutmen resmi tidak membebankan biaya tiket/pelatihan di muka tanpa rincian perjanjian kerja resmi.
                        </span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-aman shrink-0 mt-2" />
                        <span>
                          <strong>Tetap cermat:</strong> Pastikan Anda menandatangani Perjanjian Kerja (PK) yang disahkan oleh instansi ketenagakerjaan resmi.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full bg-aman shrink-0 mt-2" />
                        <span>
                          <strong>Kroscek visa:</strong> Pastikan jenis visa yang diterbitkan adalah visa kerja resmi (bukan visa wisata/kunjungan).
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
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

