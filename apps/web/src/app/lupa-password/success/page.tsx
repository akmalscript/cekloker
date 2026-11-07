import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PasswordSuccessPage() {
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

        <h1 className="text-center text-[28px] sm:text-[40px]">Password diubah</h1>
        <p className="mt-2 max-w-[448px] text-center text-[15px] leading-relaxed text-muted">
          Anda dapat masuk kembali dengan password baru.
        </p>

        {/* Kartu konfirmasi */}
        <div className="card mt-6 w-full max-w-[448px] p-6 sm:p-8">
          <div className="alert border-aman bg-white" role="status">
            <CheckCircle
              className="mt-0.5 h-5 w-5 shrink-0 text-aman"
              aria-hidden="true"
            />
            <p className="text-ink font-semibold">Password berhasil diubah</p>
          </div>

          <Link href="/login" className="btn btn-primary mt-6 w-full">
            Masuk
          </Link>
        </div>
      </main>

      <footer className="mt-auto px-4 pb-8 pt-6 text-center">
        <p className="text-[13px] text-muted">© 2026 CekLoker. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

