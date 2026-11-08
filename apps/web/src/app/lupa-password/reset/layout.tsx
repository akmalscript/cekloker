import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buat password baru — CekLoker",
  description: "Buat password baru untuk melindungi akun CekLoker Anda.",
};

export default function ResetLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
