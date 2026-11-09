import NextAuth from "next-auth";
import { authConfig } from "@/server/auth.config";
import { NextResponse } from "next/server";
import { locales, isLocale } from "@/lib/i18n";
import { env } from "@/lib/env";

const DEFAULT_LOCALE = env.DEFAULT_LOCALE ?? "am";
const PUBLIC_FILE = /\.(.*)$/;

// Initialize NextAuth with the Edge-safe config
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  
  const pathname = nextUrl.pathname;
  const search = nextUrl.search;
  const segs = pathname.split("/").filter(Boolean);
  
  const rawLocale = segs[0];
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const isApiRoute = pathname.startsWith("/api");
  const isPublicFile = PUBLIC_FILE.test(pathname) || pathname.includes("/favicon.ico");
  const isLoginRoute = pathname === `/${locale}/login` || pathname === "/login";
  const isChangePasswordRoute = pathname.includes("/change-password");

    if (pathname.startsWith("/console")) {
    return NextResponse.next();
  }

  if (isApiRoute || isPublicFile) {
    return NextResponse.next();
  }

  if (segs.length === 0 || !isLocale(segs[0])) {
    const cookie = req.cookies.get("locale")?.value;
    const redirectLocale = cookie && isLocale(cookie) ? cookie : DEFAULT_LOCALE;
    const rest = pathname === "/" ? "" : pathname;
    return NextResponse.redirect(new URL(`/${redirectLocale}${rest}${search}`, req.url));
  }

  if (!isLoggedIn && !isLoginRoute) {
    return NextResponse.redirect(new URL(`/${locale}/login`, nextUrl));
  }

  if (isLoggedIn && req.auth?.user?.mustChangePassword && !isChangePasswordRoute) {
    return NextResponse.redirect(new URL(`/${locale}/change-password`, nextUrl));
  }

  if (isLoggedIn && !req.auth?.user?.mustChangePassword && isChangePasswordRoute) {
    return NextResponse.redirect(new URL(`/${locale}/reports`, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};