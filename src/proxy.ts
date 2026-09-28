import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAMES, verifyCookie } from "@/lib/auth";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/invite")) {
    if (!verifyCookie(req.cookies.get(COOKIE_NAMES.guest)?.value)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.search = "?reason=session";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (verifyCookie(req.cookies.get(COOKIE_NAMES.admin)?.value) !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/invite/:path*", "/admin/:path*"],
};
