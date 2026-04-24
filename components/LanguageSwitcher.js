"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { localizePath, stripFaPrefix } from "../lib/locale";

export default function LanguageSwitcher({ locale = "en" }) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const normalizedPath = stripFaPrefix(pathname);
  const query = searchParams?.toString();
  const enHref = `${localizePath(normalizedPath, "en")}${query ? `?${query}` : ""}`;
  const faHref = `${localizePath(normalizedPath, "fa")}${query ? `?${query}` : ""}`;

  return (
    <div className="language-links">
      <a className={`lang-link ${locale === "en" ? "active" : ""}`} href={enHref}>
        EN
      </a>
      <span className="lang-divider">|</span>
      <a className={`lang-link ${locale === "fa" ? "active" : ""}`} href={faHref}>
        FA
      </a>
    </div>
  );
}
