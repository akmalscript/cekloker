import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password diubah — CekLoker",
  description:
    "Password akun CekLoker Anda sudah diubah. Masuk kembali dengan password baru.",
};

export default function SuccessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
