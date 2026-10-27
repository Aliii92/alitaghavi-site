import { localizePath, stripFaPrefix } from "./locale.js";

const INTERNAL_LISTING_ROUTES = [
  "/listings", "/ready-properties", "/resale-off-plan", "/off-plan-projects", "/areas"
];

export function safePropertyReturnPath(value, locale = "en", fallback = "/listings") {
  const defaultPath = localizePath(fallback, locale);
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x1f]/.test(value)) {
    return defaultPath;
  }

  try {
    const parsed = new URL(value, "https://www.alitaghavi.ae");
    if (parsed.origin !== "https://www.alitaghavi.ae") return defaultPath;
    const route = stripFaPrefix(parsed.pathname);
    if (route !== "/" && !INTERNAL_LISTING_ROUTES.some((allowed) => route === allowed || route.startsWith(`${allowed}/`))) {
      return defaultPath;
    }
    return localizePath(`${route}${parsed.search}`, locale);
  } catch {
    return defaultPath;
  }
}
