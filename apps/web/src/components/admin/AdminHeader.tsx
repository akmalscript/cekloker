"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ShieldAlert, LogOut, ArrowLeft, LayoutDashboard, Inbox, Database } from "lucide-react";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();

  const isDashboardActive = pathname === "/admin";
  const isLaporanActive = pathname.startsWith("/admin/laporan");

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex w-full max-w-[1248px] flex-wrap items-center px-4 sm:px-6 md:h-16 md:flex-nowrap">
        {/* Brand */}
        <Link
          href="/admin"
          className="mr-auto flex h-[60px] items-center gap-2 rounded-ctl text-xl font-bold tracking-tight text-ink md:mr-0 md:h-16"
          aria-label="CekLoker, ke dashboard admin"
        >
          <svg className="h-7 w-7 shrink-0" viewBox="0 0 32 32" aria-hidden="true">
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
          <span className="rounded bg-navy-tint px-2 py-0.5 text-xs font-bold text-navy">
            {user.role || "ADMIN"}
          </span>
        </Link>

        {/* Navigation */}
        <nav
          aria-label="Navigasi admin"
          className="order-3 flex w-full items-center gap-2 overflow-x-auto pb-3 md:order-2 md:ml-10 md:mr-auto md:w-auto md:pb-0"
        >
          <Link
            href="/admin"
            className={`inline-flex h-10 items-center gap-1.5 rounded-ctl px-3.5 text-[14px] font-semibold transition-colors ${
              isDashboardActive
                ? "bg-navy-tint text-navy"
                : "text-muted hover:bg-navy-tint hover:text-navy"
            }`}
            aria-current={isDashboardActive ? "page" : undefined}
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/laporan"
            className={`inline-flex h-10 items-center gap-1.5 rounded-ctl px-3.5 text-[14px] font-semibold transition-colors ${
              isLaporanActive
                ? "bg-navy-tint text-navy"
                : "text-muted hover:bg-navy-tint hover:text-navy"
            }`}
            aria-current={isLaporanActive ? "page" : undefined}
          >
            <Inbox className="h-4 w-4" aria-hidden="true" />
            <span>Laporan Masuk</span>
          </Link>

          <Link
            href="/database-loker"
            target="_blank"
            className="inline-flex h-10 items-center gap-1.5 rounded-ctl px-3.5 text-[14px] font-medium text-muted transition-colors hover:bg-navy-tint hover:text-navy"
          >
            <Database className="h-4 w-4" aria-hidden="true" />
            <span>Database Publik</span>
          </Link>
        </nav>

        {/* User profile & actions */}
        <div className="order-2 flex items-center gap-3 py-2 md:order-3">
          <div className="hidden text-right lg:block">
            <p className="text-xs font-bold text-ink leading-none">
              {user.name || user.email?.split("@")[0]}
            </p>
            <p className="text-[11px] text-muted leading-tight mt-0.5">{user.email}</p>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-1.5 rounded-ctl px-3 py-1.5 text-[13px] font-semibold text-muted hover:bg-red-50 hover:text-bahaya transition-colors"
            title="Keluar dari sesi admin"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}

