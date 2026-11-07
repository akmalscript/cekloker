"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

function ResetContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      router.push("/lupa-password/expired");
      return;
    }

    if (password.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    if (password !== password2) {
      setError("Ulangi password baru tidak cocok.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "expired") {
          router.push("/lupa-password/expired");
          return;
        }
        setError(data.error || "Gagal mengubah password.");
        setLoading(false);
        return;
      }

      router.push("/lupa-password/success");
    } catch (err) {
      console.error("Reset password submit error:", err);
      setError("Terjadi kesalahan sistem. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col grid-paper">
      <main
        id="konten"
        className="flex flex-col items-center px-4 pb-6 pt-6 sm:px-6 sm:pt-20"
      >
        {/* Logo */}
        <Link
          href="/"
          className="mb-6 flex items-center gap-2 rounded-ctl text-xl font-extrabold tracking-tight text-navy"
          aria-label="CekLoker, ke beranda"
        >
          <svg className="h-9 w-9 shrink-0" viewBox="0 0 32 32" aria-hidden="true">
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

        <h1 className="text-center text-[28px] sm:text-[40px]">Buat password baru</h1>
        <p className="mt-2 max-w-[448px] text-center text-[15px] leading-relaxed text-muted">
          Gunakan password baru untuk melindungi akun Anda.
        </p>

        {/* Kartu form */}
        <div className="card mt-6 w-full max-w-[448px] p-6 sm:p-8">
          {error && (
            <div className="alert alert-error mb-4" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0 text-bahaya" aria-hidden="true" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="password" className="field-label">
                Password baru
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input !pr-32"
                  autoComplete="new-password"
                  placeholder="Minimal 8 karakter"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-lg px-3 text-[13px] font-semibold text-navy hover:bg-navy-tint"
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
              <p className="mt-2 text-[13px] leading-snug text-muted">
                Minimal 8 karakter
              </p>
            </div>

            <div>
              <label htmlFor="password2" className="field-label">
                Ulangi password baru
              </label>
              <input
                id="password2"
                name="password2"
                type={showPassword ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="input mt-2"
                autoComplete="new-password"
                placeholder="Minimal 8 karakter"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full"
              >
                {loading && <span className="spinner" aria-hidden="true" />}
                <span>{loading ? "Menyimpan..." : "Simpan Password Baru"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="mt-auto px-4 pb-8 pt-6 text-center">
        <p className="text-[13px] text-muted">© 2026 CekLoker. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center grid-paper">
          <div className="spinner border-navy" />
        </div>
      }
    >
      <ResetContent />
    </Suspense>
  );
}

