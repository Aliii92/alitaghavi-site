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

  // Next may run the proxy again for the internal rewrite destination.
  // Preserve only a Persian path that exactly maps to this destination.
  const visible = request.headers.get("x-visible-pathname") || "";
  const inheritedPersian = request.headers.get("x-locale") === "fa" &&
    (visible === "/fa" || visible.startsWith("/fa/")) &&
    (visible.replace(/^\/fa/, "") || "/") === pathname;

  return NextResponse.next({
    request: {
      headers: buildHeaders(request, inheritedPersian ? "fa" : "en", inheritedPersian ? visible : pathname)
    }
  });
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"]
};

