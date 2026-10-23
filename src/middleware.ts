import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/lib/zod";

const PUBLIC_PATHS = ["/login"];
const DEFAULT_LOCALE = "am";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const segs = pathname.split("/").filter(Boolean);

  // 1. No locale prefix → redirect to /<locale><path>
  if (segs.length === 0 || !isLocale(segs[0])) {
    const cookie = req.cookies.get("locale")?.value;
    const locale = isLocale(cookie) ? cookie : DEFAULT_LOCALE;
    const rest = pathname === "/" ? "" : pathname;
    return NextResponse.redirect(new URL(`/${locale}${rest}${search}`, req.url));
  }

  // 2. Under /<locale>, gate non-public routes
  const locale = segs[0];
  const rest = "/" + segs.slice(1).join("/");
  const isPublic = PUBLIC_PATHS.some(
    (p) => rest === p || rest.startsWith(p + "/"),
  );

  if (!isPublic) {
    const hasSession = Boolean(
      req.cookies.get("authjs.session-token")?.value ||
        req.cookies.get("__Secure-authjs.session-token")?.value ||
        req.cookies.get("__Host-authjs.session-token")?.value
    );
    if (!hasSession) {
      const url = new URL(`/${locale}/login`, req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Match every path except Next internals, API routes, and ANY file with an extension (like .png, .jpg, .ico)
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\\..*).*)",
  ],
};