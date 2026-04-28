"use client";

import Link from "next/link";

export default function AreaPageError({ error }) {
  console.error("[app/areas/[area]/error]", error);

  return (
    <main className="luxury-page listings-page">
      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">Area listings</p>
            <h1>Area listings</h1>
            <p className="section-text">We could not load this area right now.</p>
            {process.env.NODE_ENV !== "production" && error?.message ? (
              <p className="section-text">{error.message}</p>
            ) : null}
            <Link className="button secondary-button back-to-listings-button" href="/ready-properties">
              Back to All Areas
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
