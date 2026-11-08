"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, CircleAlert } from "lucide-react";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateNama(val: string): string {
  const v = val.trim();
  if (!v) return "Nama pengguna wajib diisi.";
  if (v.length < 3) return "Nama pengguna minimal 3 karakter.";
  if (v.length > 30) return "Nama pengguna maksimal 30 karakter.";
  return "";
}

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

function validatePassword2(val: string, pw: string): string {
  if (!val) return "Ulangi password Anda.";
  if (val !== pw) return "Password belum sama. Periksa kembali.";
  return "";
}

export default function RegisterPage() {
  const router = useRouter();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    nama?: string;
    email?: string;
    password?: string;
    password2?: string;
  }>({});
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setServerError(null);

    const errNama = validateNama(nama);
    const errEmail = validateEmail(email);
    const errPw = validatePassword(password);
    const errPw2 = validatePassword2(password2, password);

    const newErrors = {
      nama: errNama,
      email: errEmail,
      password: errPw,
      password2: errPw2,
    };
    setErrors(newErrors);

    if (errNama) {
      document.getElementById("nama")?.focus();
      return;
    }
    if (errEmail) {
      document.getElementById("email")?.focus();
      return;
    }
    if (errPw) {
      document.getElementById("password")?.focus();
      return;
    }
    if (errPw2) {
      document.getElementById("password2")?.focus();
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nama.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Gagal membuat akun.");
        setLoading(false);
        return;
      }

      // Login otomatis setelah registrasi berhasil
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
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
      setServerError("Terjadi kesalahan sistem saat mendaftar.");
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setGoogleLoading(true);
      setServerError(null);
      await signIn("google", { callbackUrl: "/riwayat" });
    } catch (err) {
      console.error("Google sign up error:", err);
      setServerError("Gagal menghubungkan ke akun Google. Silakan coba lagi.");
      setGoogleLoading(false);
    }
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
          {serverError && (
            <div className="alert alert-error mb-4" role="alert">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-bahaya-ink" aria-hidden="true" />
              <div>
                <p className="font-bold text-ink">Gagal membuat akun</p>
                <p className="text-sm text-muted">{serverError}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={loading || googleLoading}
            className="btn btn-secondary w-full !text-ink short:min-h-[40px]"
          >
            {googleLoading ? (
              <span className="spinner spinner-navy" aria-hidden="true" />
            ) : (
              <GoogleIcon />
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
                Nama pengguna
              </label>
              <input
                id="nama"
                name="nama"
                type="text"
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  if (attempted || errors.nama) {
                    setErrors((prev) => ({ ...prev, nama: validateNama(e.target.value) }));
                  }
                }}
                onBlur={() => {
                  if (attempted || nama) {
                    setErrors((prev) => ({ ...prev, nama: validateNama(nama) }));
                  }
                }}
                className="input mt-2 short:mt-1 short:h-10"
                autoComplete="username"
                aria-invalid={Boolean(errors.nama)}
                aria-describedby={errors.nama ? "nama-error" : undefined}
              />
              {errors.nama && (
                <p id="nama-error" className="field-error" role="alert">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errors.nama}</span>
                </p>
              )}
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (attempted || errors.email) {
                    setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
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
                    if (password2) {
                      setErrors((prev) => ({
                        ...prev,
                        password2: validatePassword2(password2, val),
                      }));
                    }
                  }}
                  onBlur={() => {
                    if (attempted || password) {
                      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
                    }
                  }}
                  className="input !pr-14 short:h-10"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    [
                      "password-hint",
                      errors.password ? "password-error" : null,
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 grid h-10 w-10 short:h-9 short:w-9 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-navy-tint hover:text-navy"
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  aria-pressed={showPassword}
                  aria-controls="password password2"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p id="password-hint" className="mt-2 text-[13px] leading-snug text-muted">
                Minimal 8 karakter
              </p>
              {errors.password && (
                <p id="password-error" className="field-error" role="alert">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errors.password}</span>
                </p>
              )}
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
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword2(val);
                  if (attempted || errors.password2) {
                    setErrors((prev) => ({
                      ...prev,
                      password2: validatePassword2(val, password),
                    }));
                  }
                }}
                onBlur={() => {
                  if (attempted || password2) {
                    setErrors((prev) => ({
                      ...prev,
                      password2: validatePassword2(password2, password),
                    }));
                  }
                }}
                className="input mt-2 short:mt-1 short:h-10"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password2)}
                aria-describedby={errors.password2 ? "password2-error" : undefined}
              />
              {errors.password2 && (
                <p id="password2-error" className="field-error" role="alert">
                  <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errors.password2}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn btn-primary w-full short:min-h-[40px]"
            >
              {loading && <span className="spinner" aria-hidden="true" />}
              <span>{loading ? "Memproses..." : "Daftar"}</span>
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

