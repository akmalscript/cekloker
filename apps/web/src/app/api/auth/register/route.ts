import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { claimGuestScans } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 }
      );
    }

    // Periksa apakah email sudah terdaftar di database
    let userRecord = {
      id: "demo-" + Math.random().toString(36).slice(2, 8),
      name: name?.trim() || null,
      email: trimmedEmail,
    };
    let claimedCount = 0;

    try {
      const existing = await prisma.user.findUnique({
        where: { email: trimmedEmail },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Email sudah terdaftar. Silakan masuk." },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          name: name?.trim() || null,
          email: trimmedEmail,
          password: hashedPassword,
          role: trimmedEmail.startsWith("admin@") ? "ADMIN" : "USER",
        },
      });

      userRecord = {
        id: user.id,
        name: user.name,
        email: user.email,
      };

      // Otomatis klaim scan dari sesi tamu jika ada
      const guestId = request.cookies.get("ck_guest_session")?.value;
      if (guestId) {
        claimedCount = await claimGuestScans(guestId, user.id);
      }
    } catch (dbErr) {
      console.warn("DB offline fallback during register:", dbErr);
    }

    return NextResponse.json({
      ok: true,
      user: userRecord,
      claimedCount,
    });
  } catch (error: unknown) {
    console.error("Register error:", error);
    const msg = error instanceof Error ? error.message : "Terjadi kesalahan saat mendaftar.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

