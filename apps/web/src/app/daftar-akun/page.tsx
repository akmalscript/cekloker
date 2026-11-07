"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrim = email.trim();
    if (!emailTrim) {
      setError("Email wajib diisi.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== password2) {
      setError("Ulangi password tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nama.trim() || undefined,
          email: emailTrim,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal membuat akun.");
        setLoading(false);
        return;
      }

      // Login otomatis setelah registrasi berhasil
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: emailTrim,
        password,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/riwayat");
        router.refresh();
      }
    } catch (err) {
      console.error("Register error:", err);
      setError("Terjadi kesalahan sistem saat mendaftar.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl: "/riwayat" });
  };

  return (
    <div className="relative flex min-h-screen flex-col grid-paper">
      <a href="#form-daftar" className="skip-link">
        Lewati ke formulir daftar
      </a>

      {/* Kembali (pojok kiri atas) */}
      <header className="px-4 pt-4 sm:absolute sm:left-0 sm:top-0 sm:px-6 sm:pt-6 short:pt-4">
        <Link href="/" className="btn btn-ghost btn-sm !px-3">
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

        <h1 className="text-center text-[32px] sm:text-[40px] short:text-[32px]">Buat akun</h1>
        <p className="mt-2 text-center text-[15px] leading-normal text-muted short:mt-1">
          Simpan riwayat pemeriksaan Anda
        </p>

        {/* Kartu form */}
        <div className="card mt-8 w-full max-w-[448px] p-6 short:mt-4 short:py-5">
          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0 text-bahaya" aria-hidden="true" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="btn btn-secondary w-full !text-ink short:min-h-[40px]"
          >
            {googleLoading ? (
              <span className="spinner border-navy" aria-hidden="true" />
            ) : (
              <svg
                className="h-5 w-5 text-navy"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M20 12a8 8 0 1 1-2.34-5.66" />
                <path d="M20 12h-7" />
              </svg>
            )}
            <span>Daftar dengan Google</span>
          </button>

          <div className="my-4 flex items-center gap-4 text-sm font-medium text-muted short:my-2">
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            atau
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>

          <form
            id="form-daftar"
            onSubmit={handleSubmit}
            className="space-y-4 short:space-y-3"
            noValidate
          >
            <div>
              <label htmlFor="nama" className="field-label">
                Nama lengkap
              </label>
              <input
                id="nama"
                name="nama"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="input mt-2 short:mt-1 short:h-10"
                autoComplete="name"
                placeholder="Nama Anda"
              />
            </div>

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

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div className="relative mt-2 short:mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input !pr-32 short:h-10"
                  aria-describedby="password-hint"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-navy hover:bg-navy-tint short:h-9"
                  aria-controls="password password2"
                >
                  {showPassword ? (
                    <>
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                      <span>Sembunyikan</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      <span>Tampilkan</span>
                    </>
                  )}
                </button>
              </div>
              <p id="password-hint" className="mt-2 text-[13px] leading-snug text-muted">
                Minimal 8 karakter
              </p>
            </div>

            <div>
              <label htmlFor="password2" className="field-label">
                Ulangi password
              </label>
              <input
                id="password2"
                name="password2"
                type={showPassword ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="input mt-2 short:mt-1 short:h-10"
                autoComplete="new-password"
                placeholder="Ketik ulang password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn btn-primary w-full short:min-h-[40px]"
            >
              {loading && <span className="spinner" aria-hidden="true" />}
              <span>{loading ? "Mendaftarkan..." : "Daftar"}</span>
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[15px] text-muted short:mt-3 short:text-sm">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="rounded font-bold text-navy underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </p>

        {/* Jalur tamu */}
        <div className="mt-6 w-full max-w-[448px] rounded-card border border-navy-soft bg-navy-tint p-3 short:mt-3 short:p-2">
          <Link
            href="/cekloker"
            className="btn btn-ghost w-full hover:!bg-navy-soft short:min-h-[40px]"
          >
            Cek tanpa login
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </main>
    </div>
  );
}

