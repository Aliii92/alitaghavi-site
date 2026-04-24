import { NextResponse } from "next/server";

function buildHeaders(request, locale, visiblePathname) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  requestHeaders.set("x-visible-pathname", visiblePathname);
  return requestHeaders;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/fa" || pathname.startsWith("/fa/")) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname === "/fa" ? "/" : pathname.replace(/^\/fa/, "") || "/";

    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: buildHeaders(request, "fa", pathname)
      }
    });
  }

  return NextResponse.next({
    request: {
      headers: buildHeaders(request, "en", pathname)
    }
  });
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"]
};
