import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Periksa email Anda — CekLoker",
  description:
    "Tautan reset password CekLoker sudah dikirim. Periksa kotak masuk dan folder spam.",
};

export default function SentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
