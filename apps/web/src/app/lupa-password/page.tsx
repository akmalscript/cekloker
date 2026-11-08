"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("Email wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal memproses permintaan reset password.");
        setLoading(false);
        return;
      }

      // Simpan email dan navigasi ke halaman konfirmasi
      router.push(`/lupa-password/sent?email=${encodeURIComponent(emailTrim)}`);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col grid-paper">
      <a href="#form-lupa" className="skip-link">
        Lewati ke formulir lupa password
      </a>

      {/* Kembali (pojok kiri atas) */}
      <header className="px-4 pt-4 sm:absolute sm:left-0 sm:top-0 sm:px-6 sm:pt-6 short:pt-4">
        <Link href="/masuk" className="btn btn-ghost btn-sm !px-3">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali
        </Link>
      </header>

      <main
        id="konten"
        className="flex flex-col items-center px-4 pb-6 pt-6 sm:px-6 sm:pt-20 short:pt-8"
      >
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 rounded-ctl text-xl font-extrabold tracking-tight text-navy short:mb-3"
          aria-label="CekLoker, ke beranda"
        >
          <svg className="h-9 w-9 shrink-0 short:h-8 short:w-8" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#1E3A8A" />
            <path
              d="M9 13V9h4M19 9h4v4M23 19v4h-4M13 23H9v-4"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12.5 16.2l2.4 2.4 4.6-4.6"
              stroke="#fff"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          CekLoker
        </Link>

        <h1 className="text-center text-[28px] sm:text-[40px] short:text-[32px]">Lupa password?</h1>
        <p className="mt-2 max-w-[448px] text-center text-[15px] leading-relaxed text-muted short:mt-1">
          Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang password.
        </p>

        {/* Kartu form */}
        <div className="card mt-6 w-full max-w-[448px] p-6 short:mt-4 short:py-5">
          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0 text-bahaya" aria-hidden="true" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form
            id="form-lupa"
            onSubmit={handleSubmit}
            className="space-y-4 short:space-y-3"
            noValidate
          >
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input mt-2 short:mt-1 short:h-10"
                autoComplete="email"
                inputMode="email"
                placeholder="nama@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full short:min-h-[40px]"
            >
              {loading && <span className="spinner" aria-hidden="true" />}
              <span>{loading ? "Mengirim..." : "Kirim Tautan Reset"}</span>
            </button>
          </form>
        </div>
      </main>

      <footer className="mt-auto px-4 pb-8 pt-6 text-center short:pb-4">
        <p className="text-[13px] text-muted">© 2026 CekLoker. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

