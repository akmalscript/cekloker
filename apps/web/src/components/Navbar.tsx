"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <nav
        className="container-page flex h-16 items-center justify-between gap-4"
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-ctl text-lg font-extrabold tracking-tight text-ink"
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

        {/* Desktop Links */}
        <div className="hidden items-center gap-1 md:flex">
          <Link href="/#cara-kerja" className="nav-link">
            Cara Kerja
          </Link>
          <Link href="/#fitur" className="nav-link">
            Fitur
          </Link>
          <Link href="/#faq" className="nav-link">
            FAQ
          </Link>
          <Link href="/database-loker" className="nav-link">
            Database Loker
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="flex items-center gap-2">
          <Link href="/login" className="nav-link hidden md:inline-flex">
            Masuk
          </Link>
          <Link href="/cekloker" className="btn btn-primary btn-sm hidden md:inline-flex">
            Cek Loker
          </Link>

          {/* Mobile menu trigger */}
          <button
            type="button"
            className="btn btn-ghost btn-sm !px-2.5 md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="border-b border-line bg-white px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            <Link
              href="/#cara-kerja"
              className="nav-link w-full py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Cara Kerja
            </Link>
            <Link
              href="/#fitur"
              className="nav-link w-full py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Fitur
            </Link>
            <Link
              href="/#faq"
              className="nav-link w-full py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            <Link
              href="/database-loker"
              className="nav-link w-full py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Database Loker
            </Link>
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
              <Link
                href="/login"
                className="btn btn-secondary w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Masuk
              </Link>
              <Link
                href="/cekloker"
                className="btn btn-primary w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                Cek Loker Sekarang
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

