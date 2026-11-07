import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { claimGuestScans } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Diperlukan autentikasi untuk mengklaim riwayat." },
        { status: 401 }
      );
    }

    const guestId = request.cookies.get("ck_guest_session")?.value;
    if (!guestId) {
      return NextResponse.json({ ok: true, claimedCount: 0 });
    }

    const claimedCount = await claimGuestScans(guestId, session.user.id);

    return NextResponse.json({
      ok: true,
      claimedCount,
    });
  } catch (error: unknown) {
    console.error("Claim error:", error);
    return NextResponse.json({ error: "Gagal mengklaim riwayat." }, { status: 500 });
  }
}

