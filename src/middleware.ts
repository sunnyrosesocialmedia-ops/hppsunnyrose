import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifyAdminToken } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicAdminApiPaths = ["/api/admin/login", "/api/admin/setup"];
  const publicAdminPagePaths = ["/admin/login", "/admin/setup"];

  const isAdminApi = pathname.startsWith("/api/admin") && !publicAdminApiPaths.includes(pathname);
  const isAdminPage = pathname.startsWith("/admin") && !publicAdminPagePaths.includes(pathname);

  if (!isAdminApi && !isAdminPage) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  if (!session) {
    if (isAdminApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
