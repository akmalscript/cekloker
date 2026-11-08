"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCheck,
  MessageCircle,
  CircleCheck,
  Info,
  CloudUpload,
  CircleAlert,
  EyeOff,
  ArrowRight,
  Trash2,
  Image as ImageIcon,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 10;
const MAX_TOTAL_SIZE_MB = 25;
const MAX_TEXT_LENGTH = 10000;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function CekLokerPage() {
  const router = useRouter();
  const [jenis, setJenis] = useState<"lowongan" | "chat">("lowongan");
  const [files, setFiles] = useState<File[]>([]);
  const [teks, setTeks] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quotaRemaining, setQuotaRemaining] = useState<number>(3);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [showDemoModal, setShowDemoModal] = useState<boolean>(false);
  const [demoInputKey, setDemoInputKey] = useState<string>("");
  const [demoError, setDemoError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil kuota tamu dari server & deteksi akses demo juri (?demo_key=juri2026)
  useEffect(() => {
    // 1. Cek parameter URL (?demo_key=juri2026) atau cookie / localStorage
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlDemoKey = params.get("demo_key");
      if (urlDemoKey === "juri2026") {
        document.cookie = "ck_demo_access=juri2026; path=/; max-age=2592000; SameSite=Lax";
        try {
          localStorage.setItem("ck_demo_access", "juri2026");
        } catch {}
        setIsDemoMode(true);
      } else {
        const hasCookie = document.cookie.includes("ck_demo_access=juri2026");
        let hasStorage = false;
        try {
          hasStorage = localStorage.getItem("ck_demo_access") === "juri2026";
        } catch {}
        if (hasCookie || hasStorage) {
          setIsDemoMode(true);
        }
      }
    }

    // 2. Ambil kuota tamu dari server
    async function loadQuota() {
      try {
        const res = await fetch("/api/quota");
        if (res.ok) {
          const data = await res.json();
          setQuotaRemaining(data.remaining ?? 3);
          if (data.isDemo) {
            setIsDemoMode(true);
          }
        }
      } catch (err) {
        console.warn("Gagal mengambil kuota:", err);
      } finally {
        setQuotaLoading(false);
      }
    }
    loadQuota();
  }, []);

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];

    const totalCount = files.length + newFiles.length;
    if (totalCount > MAX_FILES) {
      setError(`Maksimal ${MAX_FILES} file yang dapat diunggah.`);
      return;
    }

    let currentTotalBytes = files.reduce((acc, f) => acc + f.size, 0);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`Format berkas "${file.name}" tidak didukung (gunakan JPG, PNG, atau WEBP).`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`Berkas "${file.name}" melebihi batas ukuran ${MAX_FILE_SIZE_MB} MB.`);
        return;
      }

      currentTotalBytes += file.size;
      if (currentTotalBytes > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
        setError(`Total ukuran seluruh berkas melebihi batas ${MAX_TOTAL_SIZE_MB} MB.`);
        return;
      }

      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isDemoMode && quotaRemaining <= 0) {
      setError("Jatah cek tanpa login Anda hari ini telah habis. Silakan masuk atau daftarkan akun.");
      return;
    }

    if (files.length === 0 && !teks.trim()) {
      setError("Silakan masukkan minimal satu berkas gambar atau teks lowongan.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("jenis", jenis);
      if (teks.trim()) {
        formData.append("teks", teks.trim());
      }
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Tambahkan demo_key jika dalam mode demo juri
      const activeDemo =
        isDemoMode ||
        (typeof document !== "undefined" &&
          document.cookie.includes("ck_demo_access=juri2026"));
      if (activeDemo) {
        formData.append("demo_key", "juri2026");
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: activeDemo ? { "x-demo-key": "juri2026" } : undefined,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.demo_required) {
          setShowDemoModal(true);
          throw new Error(data.message || "Akses evaluasi juri diperlukan. Silakan masukkan kode akses demo.");
        }
        if (response.status === 429) {
          setQuotaRemaining(0);
          throw new Error(data.message || "Batas kuota harian tamu telah tercapai.");
        }
        throw new Error(data.error || "Gagal melakukan analisis lowongan.");
      }

      // Berhasil: perbarui jatah kuota dan arahkan ke halaman hasil
      if (data.quota && typeof data.quota.remaining === "number") {
        setQuotaRemaining(data.quota.remaining);
      }

      router.push(`/hasil/${data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses data.";
      setError(msg);
      setLoading(false);
    }
  };

  const isQuotaExhausted = !quotaLoading && quotaRemaining <= 0;

  return (
    <>
      <a href="#konten" className="skip-link">
        Lewati ke konten utama
      </a>

      <Navbar />

      <main id="konten" className="flex-1">
        <section className="grid-paper border-b border-line" aria-labelledby="judul">
          <div className="container-page py-12 sm:py-16 short:py-8">
            {/* Header Judul */}
            <div className="text-center">
              <h1 id="judul" className="text-balance text-[40px] sm:text-5xl lg:text-[56px]">
                Periksa lowongan<span className="lg:hidden"> atau chat perekrut</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg short:mt-4">
                Verifikasi keaslian lowongan kerja atau pesan dari rekrutmen dengan bantuan AI.
              </p>

              {/* Status Kuota Tamu / Mode Demo Juri */}
              <div className="mt-8 flex justify-center short:mt-6">
                {isDemoMode ? (
                  <div
                    id="demo-pill"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-left text-[14px] font-semibold text-emerald-900 shadow-xs"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span>
                      Mode Demo Juri Aktif &bull; <span className="font-bold">Akses AI Terbuka</span>
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(true)}
                    id="quota-pill"
                    title="Klik untuk memasukkan kode akses demo juri"
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left text-[14px] font-semibold leading-snug cursor-pointer transition hover:opacity-90",
                      isQuotaExhausted
                        ? "border-bahaya-line bg-bahaya-tint text-bahaya-ink"
                        : "border-navy-soft bg-navy-tint text-navy"
                    )}
                  >
                    <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      Sisa jatah cek tanpa login:{" "}
                      <span className="font-bold">{quotaRemaining}</span> dari 3
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Peringatan Kuota Habis (Modal Ajakan Masuk) */}
            {isQuotaExhausted && !isDemoMode && (
              <div className="card mx-auto mt-6 w-full max-w-[736px] p-6 bg-amber-50 border-amber-300">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="font-bold text-amber-900">Jatah Cek Tamu Hari Ini Habis</h3>
                    <p className="text-xs text-amber-800">
                      Tamu dibatasi maksimal 3 kali cek per hari. Masuk atau daftar akun gratis untuk pemeriksaan tanpa batas dan simpan riwayat permanen.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href="/masuk" className="btn btn-secondary btn-sm">
                      <LogIn className="h-4 w-4" />
                      <span>Masuk</span>
                    </Link>
                    <Link href="/daftar" className="btn btn-primary btn-sm">
                      <UserPlus className="h-4 w-4" />
                      <span>Daftar</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Kartu Formulir Pemeriksaan */}
            <form
              id="form-periksa"
              onSubmit={handleSubmit}
              className="card mx-auto mt-8 w-full max-w-[736px] p-4 sm:p-6 shadow-card"
              noValidate
            >
              {/* Jenis Pemeriksaan */}
              <fieldset>
                <legend className="text-[13px] font-bold uppercase tracking-wide text-ink">
                  Jenis pemeriksaan
                </legend>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label
                    className={cn(
                      "type-option",
                      jenis === "lowongan" && "is-checked"
                    )}
                  >
                    <input
                      type="radio"
                      name="jenis"
                      value="lowongan"
                      className="sr-only"
                      checked={jenis === "lowongan"}
                      onChange={() => setJenis("lowongan")}
                    />
                    <span className="type-icon">
                      <FileCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="type-title block text-[17px] font-bold leading-tight text-ink">
                        Lowongan
                      </span>
                      <span className="mt-1 block text-[13px] leading-snug text-muted">
                        Cek deskripsi &amp; poster<span className="md:hidden"> lowongan</span>
                      </span>
                    </span>
                    <CircleCheck
                      className="type-check h-6 w-6"
                      aria-hidden="true"
                    />
                  </label>

                  <label
                    className={cn(
                      "type-option",
                      jenis === "chat" && "is-checked"
                    )}
                  >
                    <input
                      type="radio"
                      name="jenis"
                      value="chat"
                      className="sr-only"
                      checked={jenis === "chat"}
                      onChange={() => setJenis("chat")}
                    />
                    <span className="type-icon">
                      <MessageCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="type-title block text-[17px] font-bold leading-tight text-ink">
                        Chat perekrut
                      </span>
                      <span className="mt-1 block text-[13px] leading-snug text-muted">
                        Cek chat WhatsApp<span className="md:hidden"> </span>/<span className="md:hidden"> </span>Email
                      </span>
                    </span>
                    <CircleCheck
                      className="type-check h-6 w-6"
                      aria-hidden="true"
                    />
                  </label>
                </div>
              </fieldset>

              <p className="mt-4 hidden items-center gap-2 text-[13px] text-muted md:flex">
                <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
                Chat dan lowongan diperiksa terpisah.
              </p>

              {/* Area Unggah Berkas */}
              <div className="mt-8" role="group" aria-labelledby="upload-label">
                <p id="upload-label" className="text-[13px] font-medium italic text-muted">
                  Silakan input gambar atau teks
                </p>

                <div
                  id="dropzone"
                  className={cn(
                    "dropzone mt-4 flex flex-col items-center rounded-card border-2 border-dashed border-field bg-white px-4 py-10 text-center sm:px-6 sm:py-12 transition-colors",
                    dragActive && "is-drag !border-navy !bg-navy-tint"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <span
                    className="grid h-12 w-12 place-items-center rounded-full bg-navy-tint text-navy"
                    aria-hidden="true"
                  >
                    <CloudUpload className="h-6 w-6" />
                  </span>
                  <p className="mt-4 font-semibold text-ink">
                    Tarik berkas ke sini atau pilih berkas
                  </p>
                  <p className="mt-1 max-w-[280px] text-sm leading-snug text-muted sm:max-w-none">
                    Gambar poster atau tangkapan layar (opsional jika teks diisi)
                  </p>
                  <button
                    id="pick-btn"
                    type="button"
                    disabled={isQuotaExhausted}
                    className="btn btn-secondary btn-sm mt-4 !border-2 !border-navy cursor-pointer disabled:opacity-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Pilih Berkas
                  </button>
                  <input
                    ref={fileInputRef}
                    id="file-input"
                    type="file"
                    className="hidden"
                    multiple
                    disabled={isQuotaExhausted}
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    aria-label="Pilih file gambar"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        validateAndAddFiles(e.target.files);
                      }
                    }}
                  />
                </div>

                <p id="upload-hint" className="mt-4 text-center text-[13px] leading-snug text-muted">
                  JPG, JPEG, PNG, WEBP. Maks. 3 file, 10 MB per file, total 25 MB.
                </p>

                {/* Daftar Berkas Terpilih */}
                {files.length > 0 && (
                  <ul className="mt-4 space-y-2" aria-label="File yang akan diperiksa">
                    {files.map((file, idx) => (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-line bg-canvas p-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ImageIcon className="h-5 w-5 text-navy shrink-0" />
                          <div className="truncate text-sm font-semibold text-ink">
                            <span>{file.name}</span>
                            <span className="ml-2 text-xs font-normal text-muted">
                              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-muted hover:text-bahaya p-1 rounded transition-colors cursor-pointer"
                          aria-label={`Hapus berkas ${file.name}`}
                          onClick={() => removeFile(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {error && (
                  <p className="field-error mt-4" role="alert">
                    <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              {/* Input Teks Manual */}
              <div className="mt-8">
                <label
                  id="teks-label"
                  htmlFor="teks"
                  className="block text-[13px] font-bold uppercase tracking-wide text-ink"
                >
                  {jenis === "lowongan" ? "Teks lowongan" : "Teks percakapan chat"}
                </label>
                <div className="relative mt-4">
                  <textarea
                    id="teks"
                    name="teks"
                    value={teks}
                    disabled={isQuotaExhausted}
                    onChange={(e) => setTeks(e.target.value)}
                    className="input !h-40 resize-none !py-4 !pb-10 disabled:opacity-50"
                    maxLength={MAX_TEXT_LENGTH}
                    autoComplete="off"
                    placeholder={
                      jenis === "lowongan"
                        ? "Salin teks deskripsi lowongan di sini..."
                        : "Salin isi pesan chat atau penawaran kerja di sini..."
                    }
                    aria-describedby="teks-count"
                  />
                  <span
                    id="teks-count"
                    className="pointer-events-none absolute bottom-2 right-4 text-[13px] font-medium text-muted"
                  >
                    {teks.length.toLocaleString("id-ID")} / {MAX_TEXT_LENGTH.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Catatan Privasi (FR-PRI-01) */}
              <div className="alert alert-info mt-6" role="note">
                <EyeOff className="mt-0.5 h-5 w-5 shrink-0 text-navy" aria-hidden="true" />
                <p className="text-sm">
                  Data sensitif seperti NIK, nomor rekening, foto KTP/KK/paspor, ijazah, dan alamat
                  lengkap disamarkan (blur) otomatis di sisi server sebelum diproses oleh AI.
                </p>
              </div>

              {/* Tombol Submit */}
              <button
                id="submit-btn"
                type="submit"
                disabled={loading || (isQuotaExhausted && !isDemoMode)}
                className="btn btn-primary mt-6 w-full shadow-lift short:min-h-[40px] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Memproses Analisis...</span>
                  </>
                ) : (
                  <>
                    <span>Periksa Sekarang</span>
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Modal Kunci Akses Demo Juri */}
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="card w-full max-w-md p-6 bg-white shadow-2xl border border-line">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-navy-tint text-navy">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-base">Akses Evaluasi Demo Juri</h3>
                  <p className="text-xs text-muted">Layanan AI CekLoker diproteksi</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-ink leading-relaxed">
                Untuk melindungi kuota API model AI selama sesi penilaian, silakan masukkan kode akses demo juri:
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (demoInputKey.trim() === "juri2026") {
                    document.cookie =
                      "ck_demo_access=juri2026; path=/; max-age=2592000; SameSite=Lax";
                    try {
                      localStorage.setItem("ck_demo_access", "juri2026");
                    } catch {}
                    setIsDemoMode(true);
                    setShowDemoModal(false);
                    setDemoError(null);
                    setError(null);
                  } else {
                    setDemoError(
                      "Kunci akses demo salah. Gunakan kunci resmi dari penyelenggara/tim (juri2026)."
                    );
                  }
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label
                    htmlFor="demo-key-input"
                    className="block text-xs font-semibold text-ink mb-1"
                  >
                    Kode Akses Demo
                  </label>
                  <input
                    id="demo-key-input"
                    type="text"
                    value={demoInputKey}
                    onChange={(e) => {
                      setDemoInputKey(e.target.value);
                      setDemoError(null);
                    }}
                    placeholder="Contoh: juri2026"
                    className="input w-full"
                    autoFocus
                  />
                  {demoError && (
                    <p className="mt-1.5 text-xs text-bahaya font-medium">
                      {demoError}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDemoModal(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Aktifkan Mode Demo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
