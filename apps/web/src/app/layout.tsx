import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CekLoker — Cek Dulu Sebelum Melamar",
  description:
    "Aplikasi berbasis AI untuk membantu pencari kerja mendeteksi lowongan kerja mencurigakan, penipuan (scam), atau TPPO dengan penanda bukti visual.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
