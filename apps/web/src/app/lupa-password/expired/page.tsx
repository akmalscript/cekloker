import Link from "next/link";
import { ArrowLeft, AlertOctagon } from "lucide-react";

export default function ExpiredTokenPage() {
  return (
    <div className="relative flex min-h-screen flex-col grid-paper">
      <a href="#konten" className="skip-link">
        Lewati ke konten utama
      </a>

      {/* Kembali ke halaman masuk (pojok kiri atas) */}
      <header className="px-4 pt-4 sm:absolute sm:left-0 sm:top-0 sm:px-6 sm:pt-6">
        <Link href="/login" className="btn btn-ghost btn-sm !px-3">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Kembali ke Masuk
        </Link>
      </header>

      <main
        id="konten"
        className="flex flex-1 flex-col items-center px-4 pb-10 pt-6 sm:px-6 sm:pt-24"
      >
        {/* Logo */}
        <Link
          href="/"
          className="mb-16 flex items-center gap-2 rounded-ctl text-xl font-extrabold tracking-tight text-ink sm:mb-28"
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

        {/* Kartu status */}
        <div className="card w-full max-w-[448px] p-6 text-center">
          <AlertOctagon
            className="mx-auto h-14 w-14 text-waspada [stroke-width:1.5]"
            aria-hidden="true"
          />
          <h1 className="mt-6 text-[28px] sm:text-[32px]">Tautan sudah kedaluwarsa</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">
            Tautan reset password ini sudah tidak berlaku. Minta tautan baru untuk melanjutkan.
          </p>
          <Link href="/lupa-password" className="btn btn-primary mt-6 w-full">
            Kirim Tautan Baru
          </Link>
        </div>

        <p className="mt-6 text-center text-[15px] text-muted">
          Sudah ingat password?{" "}
          <Link
            href="/login"
            className="rounded font-bold text-navy underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        </p>
      </main>

      <footer className="px-4 py-8 text-center">
        <p className="text-[13px] text-muted">© 2026 CekLoker. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}

