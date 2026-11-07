import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white mt-auto no-print">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 rounded-ctl text-lg font-extrabold tracking-tight text-ink"
          aria-label="CekLoker, ke beranda"
        >
          <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" aria-hidden="true">
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
          <span>CekLoker</span>
        </Link>

        <nav aria-label="Tautan footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold">
            <li>
              <Link
                href="/kebijakan-privasi"
                className="rounded text-muted underline-offset-4 hover:text-navy hover:underline"
              >
                Kebijakan Privasi
              </Link>
            </li>
            <li>
              <Link
                href="/syarat-layanan"
                className="rounded text-muted underline-offset-4 hover:text-navy hover:underline"
              >
                Syarat Layanan
              </Link>
            </li>
          </ul>
        </nav>

        <p className="text-sm text-muted">© 2026 Tim CekLoker</p>
      </div>
    </footer>
  );
}

