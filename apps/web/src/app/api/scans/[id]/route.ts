import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteScan } from "@/lib/store";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteScan(id, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Pemeriksaan tidak ditemukan atau tidak memiliki izin." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, id });
  } catch (error: unknown) {
    console.error("DELETE /api/scans/[id] error:", error);
    return NextResponse.json({ error: "Gagal menghapus pemeriksaan." }, { status: 500 });
  }
}
