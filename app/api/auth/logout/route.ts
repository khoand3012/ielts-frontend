import { NextResponse, type NextRequest } from "next/server";
import { backendPost } from "@/lib/auth/backend";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // Revoking server-side is best effort: the cookies are cleared either way.
    await backendPost("/auth/logout", { refresh_token: refreshToken }).catch(() => undefined);
  }
  const out = new NextResponse(null, { status: 204 });
  clearAuthCookies(out.cookies);
  return out;
}
