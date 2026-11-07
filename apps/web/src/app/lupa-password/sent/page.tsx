"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";

function SentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const [statusText, setStatusText] = useState(
    "Jika email terdaftar, tautan reset sudah dikirim. Periksa kotak masuk dan folder spam."
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);

    try {
      if (email) {
        await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }
      setStatusText(
        "Tautan reset baru telah dikirimkan ulang. Periksa kotak masuk dan folder spam Anda."
      );
      setCooldown(30);
    } catch (err) {
      console.error("Resend error:", err);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col grid-paper">
      <a href="#konten" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* Kembali (pojok kiri atas) */}
      <header className="px-4 pt-4 sm:absolute sm:left-0 sm:top-0 sm:px-6 sm:pt-6 short:pt-4">
        <Link href="/lupa-password" className="btn btn-ghost btn-sm !px-3">
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

        <h1 className="text-center text-[28px] sm:text-[40px] short:text-[32px]">Periksa email Anda</h1>
        <p className="mt-2 max-w-[448px] text-center text-[15px] leading-relaxed text-muted short:mt-1">
          Ikuti tautan reset di email untuk membuat password baru.
        </p>

        {/* Kartu konfirmasi */}
        <div className="card mt-6 w-full max-w-[448px] p-6 short:mt-4 short:py-5">
          <div className="alert border-aman bg-white" role="status">
            <CheckCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-aman"
              aria-hidden="true"
            />
            <p className="text-ink">{statusText}</p>
          </div>

          <div className="mt-6 flex flex-col short:mt-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="btn btn-ghost w-full short:min-h-[40px]"
            >
              <span>
                {resending
                  ? "Mengirim..."
                  : cooldown > 0
                  ? `Kirim ulang (${cooldown} dtk)`
                  : "Kirim ulang"}
              </span>
            </button>
            <Link href="/login" className="btn btn-ghost w-full short:min-h-[40px]">
              Kembali ke Masuk
            </Link>
          </div>
        </div>
      </main>

      <footer className="mt-auto px-4 pb-8 pt-6 text-center short:pb-4">
        <p className="text-[13px] text-muted">© 2026 CekLoker. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

export default function SentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center grid-paper">
          <div className="spinner border-navy" />
        </div>
      }
    >
      <SentContent />
    </Suspense>
  );
}

