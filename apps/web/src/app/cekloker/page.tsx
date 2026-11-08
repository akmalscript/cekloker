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
  FileText,
  Image as ImageIcon,
  LogIn,
  UserPlus,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { cn } from "@/lib/utils";

const MAX_FILES = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_TOTAL_SIZE_MB = 25;
const MAX_TEXT_LENGTH = 10000;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ambil kuota tamu dari server
  useEffect(() => {
    async function loadQuota() {
      try {
        const res = await fetch("/api/quota");
        if (res.ok) {
          const data = await res.json();
          setQuotaRemaining(data.remaining ?? 3);
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
        setError(`Format berkas "${file.name}" tidak didukung (gunakan JPG, PNG, WEBP, atau PDF).`);
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

    if (quotaRemaining <= 0) {
      setError("Jatah cek tanpa login Anda hari ini telah habis. Silakan masuk atau daftarkan akun.");
      return;
    }

    if (files.length === 0 && !teks.trim()) {
      setError("Silakan masukkan minimal satu berkas gambar/dokumen atau teks lowongan.");
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

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
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

              {/* Status Kuota Tamu (FR-AKN-02) */}
              <div className="mt-8 flex justify-center short:mt-6">
                <p
                  id="quota-pill"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-left text-[14px] font-semibold leading-snug",
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
                </p>
              </div>
            </div>

            {/* Peringatan Kuota Habis (Modal Ajakan Masuk) */}
            {isQuotaExhausted && (
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
                  Silakan input gambar, dokumen, atau teks
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
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    aria-label="Pilih file gambar atau dokumen"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        validateAndAddFiles(e.target.files);
                      }
                    }}
                  />
                </div>

                <p id="upload-hint" className="mt-4 text-center text-[13px] leading-snug text-muted">
                  JPG, JPEG, PNG, WEBP, PDF. Maks. 5 file, 10 MB per file, total 25 MB.
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
                          {file.type === "application/pdf" ? (
                            <FileText className="h-5 w-5 text-navy shrink-0" />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-navy shrink-0" />
                          )}
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
                disabled={loading || isQuotaExhausted}
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
      </main>

      <Footer />
    </>
  );
}
