import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserScans, deleteAllUserScans } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const scans = await getUserScans(session.user.id);
    return NextResponse.json({ ok: true, data: scans });
  } catch (error: unknown) {
    console.error("GET /api/scans error:", error);
    return NextResponse.json({ error: "Gagal memuat riwayat." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const count = await deleteAllUserScans(session.user.id);
    return NextResponse.json({ ok: true, deletedCount: count });
  } catch (error: unknown) {
    console.error("DELETE /api/scans error:", error);
    return NextResponse.json({ error: "Gagal menghapus riwayat." }, { status: 500 });
  }
}
