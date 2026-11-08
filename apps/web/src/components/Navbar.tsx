"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogOut, History, User, Shield } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const isAdmin = Boolean(
    session?.user?.role === "ADMIN" ||
      session?.user?.role === "MODERATOR" ||
      session?.user?.email?.startsWith("admin@")
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <nav
        className="container-page flex h-16 items-center justify-between gap-4"
        aria-label="Navigasi utama"
      >
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6 md:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-ctl text-lg font-extrabold tracking-tight text-navy"
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

          {/* Desktop Links (di sebelah kanan logo) */}
          <div className="hidden items-center gap-0.5 md:flex md:gap-1">
            <Link href="/#cara-kerja" className="nav-link !px-2 text-sm lg:!px-3 lg:text-[15px]">
              Cara Kerja
            </Link>
            <Link href="/#fitur" className="nav-link !px-2 text-sm lg:!px-3 lg:text-[15px]">
              Fitur Utama
            </Link>
            <Link href="/database-loker" className="nav-link !px-2 text-sm lg:!px-3 lg:text-[15px]">
              Database
            </Link>
            <Link href="/lapor" className="nav-link !px-2 text-sm lg:!px-3 lg:text-[15px]">
              Laporkan
            </Link>
            <Link href="/#faq" className="nav-link !px-2 text-sm lg:!px-3 lg:text-[15px]">
              FAQ
            </Link>
            {session?.user && !isAdmin && (
              <Link href="/riwayat" className="nav-link inline-flex items-center gap-1.5 !px-2 text-sm font-bold text-navy lg:!px-3 lg:text-[15px]">
                <History className="h-4 w-4" aria-hidden="true" />
                Riwayat
              </Link>
            )}
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2">

          {status === "loading" ? (
            <div className="hidden h-9 w-20 animate-pulse rounded-ctl bg-navy-tint md:block" />
          ) : session?.user ? (
            <div className="hidden items-center gap-2 md:flex">
              {isAdmin ? (
                <Link
                  href="/admin"
                  className="nav-link inline-flex items-center gap-1.5 !px-2 text-sm font-bold text-navy lg:!px-3 lg:text-[15px]"
                >
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  <span>Admin</span>
                </Link>
              ) : (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <User className="h-4 w-4 text-muted" aria-hidden="true" />
                  {session.user.name || session.user.email?.split("@")[0]}
                </span>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className={
                  isAdmin
                    ? "btn btn-ghost btn-sm !px-2.5 !text-bahaya hover:!bg-bahaya-tint hover:!text-bahaya-ink"
                    : "btn btn-ghost btn-sm !px-2.5 text-muted hover:text-navy"
                }
                title="Keluar dari akun"
              >
                <LogOut className={`h-4 w-4 ${isAdmin ? "text-bahaya" : ""}`} aria-hidden="true" />
                <span className={`text-xs ${isAdmin ? "font-semibold text-bahaya" : ""}`}>Keluar</span>
              </button>
            </div>
          ) : (
            <>
              <Link href="/masuk" className="btn btn-primary btn-sm hidden md:inline-flex">
                Masuk
              </Link>
              <Link href="/daftar" className="btn btn-secondary btn-sm hidden md:inline-flex">
                Daftar
              </Link>
            </>
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
              Fitur Utama
            </Link>
            <Link
              href="/database-loker"
              className="nav-link w-full py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Database
            </Link>
            <Link
              href="/lapor"
              className="nav-link w-full py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Laporkan
            </Link>
            <Link
              href="/#faq"
              className="nav-link w-full py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            {session?.user && !isAdmin && (
              <Link
                href="/riwayat"
                className="nav-link w-full py-2 font-bold text-navy"
                onClick={() => setMobileMenuOpen(false)}
              >
                Riwayat Pemeriksaan
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className="nav-link inline-flex items-center gap-2 w-full py-2 font-bold text-navy"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shield className="h-4 w-4" aria-hidden="true" />
                Panel Administrasi
              </Link>
            )}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
              {session?.user ? (
                <>
                  {!isAdmin && (
                    <div className="px-3 py-1 text-sm text-muted">
                      Masuk sebagai <strong>{session.user.name || session.user.email}</strong>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className={
                      isAdmin
                        ? "btn btn-secondary w-full !text-bahaya !border-bahaya-line hover:!bg-bahaya-tint hover:!text-bahaya-ink"
                        : "btn btn-secondary w-full"
                    }
                  >
                    <LogOut className={`h-4 w-4 ${isAdmin ? "text-bahaya" : ""}`} aria-hidden="true" />
                    <span className={isAdmin ? "text-bahaya font-semibold" : ""}>Keluar</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/masuk"
                    className="btn btn-primary w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/daftar"
                    className="btn btn-secondary w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Daftar
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
