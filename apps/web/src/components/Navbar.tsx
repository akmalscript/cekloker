"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, LogOut, History, User, Shield } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const isAdmin = Boolean(
    session?.user?.role === "ADMIN" ||
      session?.user?.role === "MODERATOR" ||
      session?.user?.email?.startsWith("admin@")
  );

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sectionIds = ["cara-kerja", "fitur", "faq"];

    const updateActiveSection = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const isBottom = windowHeight + scrollY >= documentHeight - 60;

      if (isBottom) {
        const faqEl = document.getElementById("faq");
        if (faqEl && faqEl.getBoundingClientRect().top < windowHeight) {
          setActiveSection("faq");
          return;
        }
      }

      let current = "";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        // Section is active when its top is under or near the header (120px) and bottom hasn't scrolled past (70px)
        if (rect.top <= 120 && rect.bottom > 70) {
          current = id;
        }
      }

      setActiveSection(current);
    };

    if (window.location.hash) {
      const hash = window.location.hash.replace("#", "");
      if (sectionIds.includes(hash)) {
        setActiveSection(hash);
      }
    }

    updateActiveSection();

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, [pathname]);

  const handleNavClick = (sectionId: string) => {
    if (pathname === "/") {
      setActiveSection(sectionId);
    }
  };

  const isCaraKerjaActive = pathname === "/" && activeSection === "cara-kerja";
  const isFiturActive = pathname === "/" && activeSection === "fitur";
  const isFaqActive = pathname === "/" && activeSection === "faq";
  const isDatabaseActive = pathname === "/database-loker" || pathname.startsWith("/database-loker/");
  const isLaporActive = pathname === "/lapor" || pathname.startsWith("/lapor/");
  const isRiwayatActive = pathname === "/riwayat" || pathname.startsWith("/riwayat/");
  const isAdminActive = pathname === "/admin" || pathname.startsWith("/admin/");

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
            <Link
              href="/#cara-kerja"
              onClick={() => handleNavClick("cara-kerja")}
              className={`nav-link !px-2 text-sm lg:!px-3 lg:text-[15px] ${
                isCaraKerjaActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              aria-current={isCaraKerjaActive ? "page" : undefined}
            >
              Cara Kerja
            </Link>
            <Link
              href="/#fitur"
              onClick={() => handleNavClick("fitur")}
              className={`nav-link !px-2 text-sm lg:!px-3 lg:text-[15px] ${
                isFiturActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              aria-current={isFiturActive ? "page" : undefined}
            >
              Fitur Utama
            </Link>
            <Link
              href="/database-loker"
              className={`nav-link !px-2 text-sm lg:!px-3 lg:text-[15px] ${
                isDatabaseActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              aria-current={isDatabaseActive ? "page" : undefined}
            >
              Database
            </Link>
            <Link
              href="/lapor"
              className={`nav-link !px-2 text-sm lg:!px-3 lg:text-[15px] ${
                isLaporActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              aria-current={isLaporActive ? "page" : undefined}
            >
              Laporkan
            </Link>
            <Link
              href="/#faq"
              onClick={() => handleNavClick("faq")}
              className={`nav-link !px-2 text-sm lg:!px-3 lg:text-[15px] ${
                isFaqActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              aria-current={isFaqActive ? "page" : undefined}
            >
              FAQ
            </Link>
            {session?.user && !isAdmin && (
              <Link
                href="/riwayat"
                className={`nav-link inline-flex items-center gap-1.5 !px-2 text-sm font-bold lg:!px-3 lg:text-[15px] ${
                  isRiwayatActive ? "bg-navy-tint !text-navy" : "text-navy"
                }`}
                aria-current={isRiwayatActive ? "page" : undefined}
              >
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
                  className={`nav-link inline-flex items-center gap-1.5 !px-2 text-sm font-bold lg:!px-3 lg:text-[15px] ${
                    isAdminActive ? "bg-navy-tint !text-navy" : "text-navy"
                  }`}
                  aria-current={isAdminActive ? "page" : undefined}
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
              className={`nav-link w-full py-2 ${
                isCaraKerjaActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              onClick={() => {
                handleNavClick("cara-kerja");
                setMobileMenuOpen(false);
              }}
              aria-current={isCaraKerjaActive ? "page" : undefined}
            >
              Cara Kerja
            </Link>
            <Link
              href="/#fitur"
              className={`nav-link w-full py-2 ${
                isFiturActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              onClick={() => {
                handleNavClick("fitur");
                setMobileMenuOpen(false);
              }}
              aria-current={isFiturActive ? "page" : undefined}
            >
              Fitur Utama
            </Link>
            <Link
              href="/database-loker"
              className={`nav-link w-full py-2 ${
                isDatabaseActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isDatabaseActive ? "page" : undefined}
            >
              Database
            </Link>
            <Link
              href="/lapor"
              className={`nav-link w-full py-2 ${
                isLaporActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={isLaporActive ? "page" : undefined}
            >
              Laporkan
            </Link>
            <Link
              href="/#faq"
              className={`nav-link w-full py-2 ${
                isFaqActive ? "bg-navy-tint !text-navy font-bold" : ""
              }`}
              onClick={() => {
                handleNavClick("faq");
                setMobileMenuOpen(false);
              }}
              aria-current={isFaqActive ? "page" : undefined}
            >
              FAQ
            </Link>
            {session?.user && !isAdmin && (
              <Link
                href="/riwayat"
                className={`nav-link w-full py-2 font-bold ${
                  isRiwayatActive ? "bg-navy-tint !text-navy" : "text-navy"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isRiwayatActive ? "page" : undefined}
              >
                Riwayat Pemeriksaan
              </Link>
            )}
            {isAdmin && (
              <Link
                href="/admin"
                className={`nav-link inline-flex items-center gap-2 w-full py-2 font-bold ${
                  isAdminActive ? "bg-navy-tint !text-navy" : "text-navy"
                }`}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isAdminActive ? "page" : undefined}
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
