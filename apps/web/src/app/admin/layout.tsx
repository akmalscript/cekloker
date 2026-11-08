"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ShieldX, Home } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/masuk?callbackUrl=/admin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="spinner !border-navy !border-t-transparent" />
        <p className="mt-4 text-sm text-muted">Memverifikasi otorisasi admin...</p>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  const role = session.user.role || "USER";
  const email = session.user.email || "";
  const isAdminOrMod =
    role === "ADMIN" ||
    role === "MODERATOR" ||
    email.startsWith("admin@") ||
    Boolean(
      process.env.ADMIN_EMAILS &&
        process.env.ADMIN_EMAILS.split(",").map((e) => e.trim()).includes(email)
    );

  if (!isAdminOrMod) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
        <div className="card max-w-md w-full p-6 sm:p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-bahaya">
            <ShieldX className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-ink">Akses Ditolak (403)</h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Halaman administrasi dan antrean moderasi hanya dapat diakses oleh akun dengan peran{" "}
            <span className="font-bold text-navy">ADMIN</span> atau{" "}
            <span className="font-bold text-navy">MODERATOR</span>.
          </p>
          <div className="mt-4 rounded-card border border-line bg-canvas p-3 text-xs text-muted text-left">
            <p>
              <strong className="text-ink">Akun Anda:</strong> {session.user.email}
            </p>
            <p className="mt-1">
              <strong className="text-ink">Peran Terdaftar:</strong> {role}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/" className="btn btn-primary w-full">
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Kembali ke Beranda</span>
            </Link>
            <Link href="/masuk" className="btn btn-secondary w-full">
              <span>Masuk dengan Akun Admin</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <AdminHeader
        user={{
          name: session.user.name,
          email: session.user.email,
          role: role === "USER" && email.startsWith("admin@") ? "ADMIN" : role,
        }}
      />
      <div className="flex-1">{children}</div>
      <footer className="border-t border-line bg-white py-6">
        <div className="mx-auto flex w-full max-w-[1248px] flex-col items-center justify-between gap-4 px-4 sm:px-6 md:flex-row">
          <p className="text-xs text-muted">
            © 2026 CekLoker — Panel Administrasi &amp; Moderasi Berita Acara. Hak cipta dilindungi.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-muted">
            <Link href="/kebijakan-privasi" className="hover:text-navy">
              Kebijakan Privasi
            </Link>
            <span>•</span>
            <Link href="/syarat-layanan" className="hover:text-navy">
              Syarat Layanan
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
