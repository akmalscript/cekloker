import { NextRequest, NextResponse } from "next/server";
import { checkGuestQuota } from "@/lib/rate-limit";
import { DEMO_COOKIE_NAME, isValidDemoKey } from "@/lib/demo-access";

export async function GET(request: NextRequest) {
  const isDemo =
    isValidDemoKey(request.cookies.get(DEMO_COOKIE_NAME)?.value) ||
    isValidDemoKey(request.nextUrl.searchParams.get("demo_key"));

  const guestId = request.cookies.get("ck_guest_session")?.value ?? "guest_default";
  const quota = checkGuestQuota(guestId);

  if (isDemo) {
    return NextResponse.json({
      ...quota,
      allowed: true,
      isDemo: true,
    });
  }

  return NextResponse.json(quota);
}
