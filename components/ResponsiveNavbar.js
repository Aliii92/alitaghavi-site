"use client";

import { useEffect, useState, useRef } from "react";
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
  const panelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = panelRef.current?.querySelectorAll('a[href], button');
    focusable?.[0]?.focus();
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab" && focusable?.length) {
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
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
              className="nav-toggle" ref={triggerRef} aria-controls="mobile-navigation"
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
          <aside id="mobile-navigation" ref={panelRef} role="dialog" aria-modal="true" aria-label={locale === "fa" ? "منوی اصلی" : "Main navigation"} className="mobile-nav-panel" onClick={(event) => event.stopPropagation()}>
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

