"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { localizePath, stripFaPrefix } from "../lib/locale";

export default function LanguageSwitcher({ locale = "en", className = "", stacked = false, onNavigate = null }) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const normalizedPath = stripFaPrefix(pathname);
  const query = searchParams?.toString();
  const enHref = `${localizePath(normalizedPath, "en")}${query ? `?${query}` : ""}`;
  const faHref = `${localizePath(normalizedPath, "fa")}${query ? `?${query}` : ""}`;

  return (
    <div className={`language-links ${stacked ? "language-links-stacked" : ""} ${className}`.trim()}>
      <a className={`lang-link ${locale === "en" ? "active" : ""}`} href={enHref} onClick={onNavigate}>
        EN
      </a>
      <span className="lang-divider">|</span>
      <a className={`lang-link ${locale === "fa" ? "active" : ""}`} href={faHref} onClick={onNavigate}>
        FA
      </a>
    </div>
  );
}
