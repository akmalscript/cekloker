import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token dan password baru wajib disertakan." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Cari token
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) {
      return NextResponse.json(
        { error: "expired", message: "Tautan reset tidak valid atau sudah kedaluwarsa." },
        { status: 400 }
      );
    }

    if (record.expires.getTime() < Date.now()) {
      await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
      return NextResponse.json(
        { error: "expired", message: "Tautan sudah kedaluwarsa. Silakan minta tautan baru." },
        { status: 400 }
      );
    }

    // Update password user
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email: record.email },
      data: { password: hashedPassword },
    });

    // Hapus token yang sudah dipakai
    await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});

    return NextResponse.json({
      ok: true,
      message: "Password berhasil diperbarui.",
    });
  } catch (error: unknown) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
  }
}

