"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, CircleAlert } from "lucide-react";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(val: string): string {
  const v = val.trim();
  if (!v) return "Email wajib diisi.";
  if (!EMAIL_RE.test(v)) return "Format email belum benar. Contoh: nama@email.com";
  return "";
}

function validatePassword(val: string): string {
  if (!val) return "Password wajib diisi.";
  if (val.length < 8) return "Password minimal 8 karakter.";
  return "";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/riwayat";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const oauthError = searchParams.get("error");
  useEffect(() => {
    if (oauthError) {
      if (oauthError === "OAuthAccountNotLinked") {
        setServerError("Email sudah terdaftar dengan kata sandi. Silakan masuk menggunakan form kata sandi.");
      } else if (oauthError === "OAuthSignin" || oauthError === "OAuthCallback") {
        setServerError("Gagal masuk dengan Google. Pastikan akun Google Anda aktif dan konfigurasi OAuth valid.");
      } else {
        setServerError(`Terjadi kendala autentikasi Google (${oauthError}).`);
      }
    }
  }, [oauthError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setServerError(null);

    const errEmail = validateEmail(email);
    const errPw = validatePassword(password);

    const newErrors = {
      email: errEmail,
      password: errPw,
    };
    setErrors(newErrors);

    if (errEmail) {
      document.getElementById("email")?.focus();
      return;
    }

    if (errPw) {
      document.getElementById("password")?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (res?.error) {
        setServerError("Email atau password tidak sesuai. Silakan periksa kembali.");
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
      setServerError("Terjadi kesalahan saat masuk. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setServerError(null);
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Google sign in error:", err);
      setServerError("Gagal menghubungkan ke akun Google. Silakan coba lagi.");
      setGoogleLoading(false);
    }
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

          {serverError && (
            <div className="alert alert-error mt-6" role="alert">
              <CircleAlert className="h-5 w-5 shrink-0 text-bahaya" aria-hidden="true" />
              <p className="text-sm font-semibold">{serverError}</p>
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
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  if (attempted || errors.email) {
                    setErrors((prev) => ({ ...prev, email: validateEmail(val) }));
                  }
                }}
                onBlur={() => {
                  if (attempted || email) {
                    setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
                  }
                }}
                className="input mt-2 short:mt-1 short:h-10"
                autoComplete="email"
                inputMode="email"
                placeholder="nama@email.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="field-error" role="alert">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errors.email}</span>
                </p>
              )}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    setPassword(val);
                    if (attempted || errors.password) {
                      setErrors((prev) => ({ ...prev, password: validatePassword(val) }));
                    }
                  }}
                  onBlur={() => {
                    if (attempted || password) {
                      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
                    }
                  }}
                  className="input !pr-14 short:h-10"
                  autoComplete="current-password"
                  placeholder="Minimal 8 karakter"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
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
              {errors.password && (
                <p id="password-error" className="field-error" role="alert">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errors.password}</span>
                </p>
              )}
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
              <span className="spinner spinner-navy" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            <span>Masuk dengan Google</span>
          </button>
        </div>

        {/* Jalur tamu */}
        <div className="mt-6 w-full max-w-[420px] rounded-card border border-navy-soft bg-navy-tint p-3 short:mt-3 short:p-2">
          <Link
            href="/cekloker"
            className="btn btn-ghost w-full hover:!bg-navy-soft short:min-h-[40px]"
          >
            Cek tanpa login
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
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

