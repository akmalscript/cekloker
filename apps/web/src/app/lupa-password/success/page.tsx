import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function PasswordSuccessPage() {
  return (
    <div className="relative flex min-h-screen flex-col grid-paper">
      <a href="#konten" className="skip-link">
        Lewati ke konten utama
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

        <h1 className="text-center text-[28px] sm:text-[40px] short:text-[32px]">Password diubah</h1>
        <p className="mt-2 max-w-[448px] text-center text-[15px] leading-relaxed text-muted short:mt-1">
          Anda dapat masuk kembali dengan password baru.
        </p>

        {/* Kartu konfirmasi */}
        <div className="card mt-6 w-full max-w-[448px] p-6 short:mt-4 short:py-5">
          <div className="alert border-aman bg-white" role="status">
            <CheckCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-aman"
              aria-hidden="true"
            />
            <p className="text-ink">Password berhasil diubah</p>
          </div>

          <Link href="/masuk" className="btn btn-primary mt-6 w-full short:mt-3 short:min-h-[40px]">
            Masuk
          </Link>
        </div>
      </main>

      <footer className="mt-auto px-4 pb-8 pt-6 text-center short:pb-4">
        <p className="text-[13px] text-muted">© 2026 CekLoker. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

