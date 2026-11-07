import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Periksa apakah user terdaftar
    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    // Buat token reset
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 jam

    if (user) {
      // Hapus token lama untuk email ini
      await prisma.passwordResetToken.deleteMany({
        where: { email: trimmedEmail },
      });

      // Simpan token baru
      await prisma.passwordResetToken.create({
        data: {
          email: trimmedEmail,
          token,
          expires,
        },
      });
    }

    const resetUrl = `/lupa-password/reset?token=${token}`;

    return NextResponse.json({
      ok: true,
      message: "Jika email terdaftar, tautan reset sudah dikirim. Periksa kotak masuk dan folder spam.",
      devResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
    });
  } catch (error: unknown) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

