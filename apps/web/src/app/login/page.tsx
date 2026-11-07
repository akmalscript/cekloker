"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/riwayat";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: emailTrim,
        password,
      });

      if (res?.error) {
        setError("Email atau password tidak sesuai. Silakan periksa kembali.");
        setLoading(false);
        return;
      }

      // Klaim riwayat scan dari sesi tamu jika ada
      try {
        await fetch("/api/auth/claim", { method: "POST" });
      } catch (claimErr) {
        console.warn("Claim guest scans warning:", claimErr);
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kesalahan saat masuk. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    signIn("google", { callbackUrl });
  };

  return (
    <div className="relative flex min-h-screen flex-col grid-paper">
      <a href="#form-masuk" className="skip-link">
        Lewati ke formulir masuk
      </a>

      {/* Kembali ke beranda (pojok kiri atas) */}
      <header className="px-4 pt-4 sm:absolute sm:left-0 sm:top-0 sm:px-6 sm:pt-6 short:pt-4">
        <Link href="/" className="btn btn-ghost btn-sm !px-3">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Beranda
        </Link>
      </header>

      <main
        id="konten"
        className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-4 sm:px-6 sm:py-12 short:py-3"
      >
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 rounded-ctl text-xl font-extrabold tracking-tight text-ink short:mb-3"
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

        {/* Kartu form */}
        <div className="card w-full max-w-[420px] p-6 sm:p-10 short:px-8 short:py-5">
          <h1 className="text-center text-[28px] sm:text-[32px] short:text-2xl">Masuk ke CekLoker</h1>
          <p className="mx-auto mt-2 max-w-[300px] text-center text-[15px] leading-normal text-muted short:mt-1">
            Simpan riwayat pemeriksaan dan bantu laporkan loker palsu.
          </p>

          {error && (
            <div className="alert alert-error mt-6" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0 text-bahaya" aria-hidden="true" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form
            id="form-masuk"
            onSubmit={handleSubmit}
            className="mt-8 space-y-5 short:mt-4 short:space-y-3"
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
                  className="input !pr-14 short:h-10"
                  autoComplete="current-password"
                  placeholder="Minimal 8 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 grid h-10 w-10 short:h-9 short:w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-navy-tint hover:text-navy"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  aria-controls="password"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex justify-end short:mt-1">
                <Link
                  href="/lupa-password"
                  className="rounded text-sm font-semibold text-navy underline-offset-4 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn btn-primary w-full short:min-h-[40px]"
            >
              {loading && <span className="spinner" aria-hidden="true" />}
              <span>{loading ? "Memproses..." : "Masuk"}</span>
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-sm font-medium text-muted short:my-2.5">
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
            atau
            <span className="h-px flex-1 bg-line" aria-hidden="true" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="btn btn-secondary w-full !text-ink short:min-h-[40px]"
          >
            {googleLoading ? (
              <span className="spinner border-navy" aria-hidden="true" />
            ) : (
              <svg
                className="h-5 w-5"
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
            <span>Masuk dengan Google</span>
          </button>
        </div>

        {/* Jalur tamu */}
        <div className="mt-6 grid w-full max-w-[420px] grid-cols-1 items-center gap-x-4 sm:grid-cols-[minmax(0,1fr)_auto] rounded-card border border-navy-soft bg-navy-tint px-5 py-4 short:mt-3 short:py-2">
          <p className="order-1 font-bold leading-snug text-ink sm:order-none">
            Belum mau daftar?
          </p>
          <Link
            href="/cekloker"
            className="btn btn-ghost btn-sm order-3 -ml-3 mt-2 justify-self-start !px-3 hover:!bg-navy-soft sm:order-none sm:row-span-2 sm:-mr-2 sm:ml-0 sm:mt-0"
          >
            Cek tanpa login
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="order-2 text-[13px] leading-snug text-muted sm:order-none">
            Tamu bisa cek 3 kali per hari
          </p>
        </div>

        <div className="mt-6 w-full max-w-[420px] text-center short:mt-3 short:max-w-[520px]">
          <p className="text-[15px] text-muted short:text-sm">
            Belum punya akun?{" "}
            <Link
              href="/daftar-akun"
              className="rounded font-bold text-navy underline-offset-4 hover:underline"
            >
              Daftar
            </Link>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted short:mt-0.5">
            Dengan masuk, kamu menyetujui pemrosesan data sesuai{" "}
            <Link
              href="/kebijakan-privasi"
              className="rounded font-semibold text-navy underline underline-offset-2"
            >
              Kebijakan Privasi
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center grid-paper">
          <div className="spinner border-navy" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

