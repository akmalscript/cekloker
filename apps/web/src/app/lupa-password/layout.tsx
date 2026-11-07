import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa password — CekLoker",
  description:
    "Atur ulang password akun CekLoker Anda lewat tautan yang dikirim ke email.",
};

export default function LupaPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
