import { NextRequest, NextResponse } from "next/server";
import { checkGuestQuota } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const guestId = request.cookies.get("ck_guest_session")?.value ?? "guest_default";
  const quota = checkGuestQuota(guestId);

  return NextResponse.json(quota);
}

