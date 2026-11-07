import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk — CekLoker",
  description:
    "Masuk ke CekLoker untuk menyimpan riwayat pemeriksaan lowongan kerja.",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
