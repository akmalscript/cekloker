"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogOut, History, User, Shield } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <nav
        className="container-page flex h-16 items-center justify-between gap-4"
        aria-label="Navigasi utama"
      >
        <div className="flex items-center gap-6 md:gap-8">
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
            {session?.user && (
              <Link href="/riwayat" className="nav-link inline-flex items-center gap-1.5 font-bold text-navy">
                <History className="h-4 w-4" aria-hidden="true" />
                Riwayat
              </Link>
            )}
            {Boolean(
              session?.user?.role === "ADMIN" ||
                session?.user?.role === "MODERATOR" ||
                session?.user?.email?.startsWith("admin@")
            ) && (
              <Link href="/admin" className="nav-link inline-flex items-center gap-1.5 font-bold text-navy">
                <Shield className="h-4 w-4" aria-hidden="true" />
                Admin
              </Link>
            )}
          </div>
        </div>

        {/* Desktop CTA */}
        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <div className="hidden h-9 w-20 animate-pulse rounded-ctl bg-navy-tint md:block" />
          ) : session?.user ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <User className="h-4 w-4 text-muted" aria-hidden="true" />
                {session.user.name || session.user.email?.split("@")[0]}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn btn-ghost btn-sm !px-2.5 text-muted hover:text-navy"
                title="Keluar dari akun"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="text-xs">Keluar</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="nav-link hidden md:inline-flex">
              Masuk
            </Link>
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-ctl p-2 text-muted hover:bg-navy-tint hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-navy md:!hidden"
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
          className="border-b border-line bg-white px-4 py-4 md:!hidden"
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
            {session?.user && (
              <Link
                href="/riwayat"
                className="nav-link w-full py-2 font-bold text-navy"
                onClick={() => setMobileMenuOpen(false)}
              >
                Riwayat Pemeriksaan
              </Link>
            )}
            {Boolean(
              session?.user?.role === "ADMIN" ||
                session?.user?.role === "MODERATOR" ||
                session?.user?.email?.startsWith("admin@")
            ) && (
              <Link
                href="/admin"
                className="nav-link w-full py-2 font-bold text-navy"
                onClick={() => setMobileMenuOpen(false)}
              >
                Panel Administrasi
              </Link>
            )}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
              {session?.user ? (
                <>
                  <div className="px-3 py-1 text-sm text-muted">
                    Masuk sebagai <strong>{session.user.name || session.user.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="btn btn-secondary w-full"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Keluar
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="btn btn-secondary w-full"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
