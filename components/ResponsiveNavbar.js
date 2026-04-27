"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

export default function ResponsiveNavbar({
  brandLabel,
  brandHref,
  links = [],
  locale = "en"
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <div className="nav-shell">
        <nav className="topbar">
          <a className="brand" href={brandHref}>
            {brandLabel}
          </a>

          <div className="nav-links desktop-nav-links">
            {links.map((link) => (
              <a key={`${link.href}-${link.label}`} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>

          <div className="topbar-controls">
            <LanguageSwitcher locale={locale} className="desktop-language-switcher" />
            <button
              type="button"
              className="nav-toggle"
              aria-label={open ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </nav>
      </div>

      {open ? (
        <div className="mobile-nav-overlay" onClick={closeMenu}>
          <aside className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}>
            <div className="mobile-nav-header">
              <strong>{brandLabel}</strong>
              <button type="button" className="mobile-nav-close" aria-label="Close menu" onClick={closeMenu}>
                ×
              </button>
            </div>

            <div className="mobile-nav-links">
              {links.map((link) => (
                <a key={`${link.href}-${link.label}-mobile`} href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              ))}
            </div>

            <div className="mobile-nav-language">
              <p className="mobile-nav-language-label">Language</p>
              <LanguageSwitcher locale={locale} stacked onNavigate={closeMenu} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
