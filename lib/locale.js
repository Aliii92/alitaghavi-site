export const DEFAULT_LOCALE = "en";

export function normalizeLocale(value) {
  return value === "fa" ? "fa" : "en";
}

export function stripFaPrefix(path = "") {
  const value = String(path || "");
  if (value === "/fa") return "/";
  if (value.startsWith("/fa/")) return value.replace(/^\/fa/, "") || "/";
  return value || "/";
}

export function localizePath(path = "/", locale = DEFAULT_LOCALE) {
  const normalizedPath = stripFaPrefix(path || "/");

  if (normalizeLocale(locale) === "fa") {
    return normalizedPath === "/" ? "/fa" : `/fa${normalizedPath}`;
  }

  return normalizedPath;
}
