import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tautan Kedaluwarsa — CekLoker",
  description:
    "Tautan reset password CekLoker sudah tidak berlaku. Minta tautan baru untuk melanjutkan.",
  robots: { index: false },
};

export default function ExpiredLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
