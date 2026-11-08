import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat akun — CekLoker",
  description:
    "Buat akun CekLoker untuk menyimpan riwayat pemeriksaan lowongan Anda.",
};

export default function DaftarAkunLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
