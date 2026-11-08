import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_KEY, DEMO_COOKIE_NAME, isValidDemoKey } from "@/lib/demo-access";

export function middleware(request: NextRequest) {
  const demoKeyParam = request.nextUrl.searchParams.get("demo_key");

  if (isValidDemoKey(demoKeyParam)) {
    const response = NextResponse.next();
    response.cookies.set(DEMO_COOKIE_NAME, DEMO_KEY, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 hari
      sameSite: "lax",
      httpOnly: false, // agar dapat dibaca oleh client-side script jika diperlukan
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
