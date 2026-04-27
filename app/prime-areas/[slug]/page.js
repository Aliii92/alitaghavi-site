import AreaPropertyFilters from "../../../components/AreaPropertyFilters";
import ResponsiveNavbar from "../../../components/ResponsiveNavbar";
import { readAreas, sanitizeAreaHtml } from "../../../lib/areas.js";
import { readProperties } from "../../../lib/properties";
import { localizePath } from "../../../lib/locale";
import { getRequestLocale } from "../../../lib/server-locale";

function NavBar({ owner = "ali", locale = "en" }) {
  const homeHref = localizePath(owner === "negin" ? "/negin" : "/", locale);
  const readyHref = localizePath(owner === "negin" ? "/negin/ready-properties" : "/ready-properties", locale);
  const offPlanHref = localizePath(owner === "negin" ? "/negin/off-plan" : "/off-plan-projects", locale);
  const resaleHref = localizePath(owner === "negin" ? "/negin/resale-off-plan" : "/resale-off-plan", locale);
  const areasHref = `${homeHref}#areas`;
  const contactHref = `${homeHref}#contact`;
  const aboutHref = `${homeHref}#advisory`;

  return (
    <ResponsiveNavbar
      brandLabel="Dubai Luxury Properties"
      brandHref={homeHref}
      links={[
        { href: readyHref, label: "Ready Properties" },
        { href: offPlanHref, label: "Off-Plan Projects" },
        { href: resaleHref, label: "Resale Off-Plan" },
        { href: areasHref, label: "Prime Areas" },
        { href: localizePath(owner === "negin" ? "/" : "/negin", locale), label: owner === "negin" ? "Ali Taghavi" : "Negin Mohamadi" },
        { href: contactHref, label: "Contact" },
        { href: aboutHref, label: owner === "negin" ? "About Negin" : "About Me" }
      ]}
      locale={locale}
    />
  );
}

function paragraphs(text) {
  return String(text || "")
    .split(/\n{2,}|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function areaMatchesProperty(area, property) {
  const aliases = [area.area_name, area.name, ...(area.aliases || [])].filter(Boolean).map((item) => item.toLowerCase());
  const haystack = `${property.area || ""} ${property.building || ""}`.toLowerCase();
  return aliases.some((alias) => haystack.includes(alias));
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const areas = await readAreas();
  return areas
    .filter((area) => area.active !== false)
    .map((area) => ({ slug: area.owner === "negin" ? `negin-${area.slug}` : area.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const owner = slug.startsWith("negin-") ? "negin" : "ali";
  const areaSlug = owner === "negin" ? slug.replace(/^negin-/, "") : slug;
  const areas = await readAreas();
  const area = areas.find((item) => item.owner === owner && item.slug === areaSlug && item.active !== false);
  const title = area?.seo_title || (area ? `${area.area_name} Area Insight` : "Prime Area Insight");
  const description = area?.seo_description || area?.excerpt || area?.short_description || area?.note || "Read Dubai prime area insights, lifestyle overview, and investment commentary.";

  return {
    title,
    description,
    alternates: {
      canonical: area ? `/prime-areas/${owner === "negin" ? `negin-${area.slug}` : area.slug}` : "/"
    },
    openGraph: {
      title,
      description,
      url: area ? `/prime-areas/${owner === "negin" ? `negin-${area.slug}` : area.slug}` : "/"
    }
  };
}

export default async function PrimeAreaDetailPage({ params }) {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const owner = slug.startsWith("negin-") ? "negin" : "ali";
  const areaSlug = owner === "negin" ? slug.replace(/^negin-/, "") : slug;
  const areas = await readAreas();
  const properties = await readProperties();
  const area = areas.find((item) => item.owner === owner && item.slug === areaSlug && item.active !== false);

  if (!area) {
    return (
      <main className="luxury-page listings-page">
        <NavBar owner={owner} locale={locale} />
        <div className="content-shell listings-page-shell">
          <section className="section listings-intro-section">
            <div className="section-header centered listings-page-header">
              <p className="section-eyebrow">Prime Areas</p>
              <h1>Area insight not found</h1>
              <p className="section-text">Return to the homepage to browse available prime area guides.</p>
              <a className="button secondary-button back-to-listings-button" href="/#areas">
                Back to Prime Areas
              </a>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const relatedProperties = properties.filter((property) => property.owner === owner && areaMatchesProperty(area, property));
  const highlights = area.bullet_points || area.notes || [];
  const articleBody = sanitizeAreaHtml(area.content_body || "");
  const featuredImage = area.featured_image || area.image_url;
  const homeHref = owner === "negin" ? "/negin" : "/";
  const backHref = `${homeHref}#areas`;

  return (
    <main className="luxury-page listings-page">
      <NavBar owner={owner} locale={locale} />
      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">Prime Area Insight</p>
            <h1>{area.hero_title || area.area_name}</h1>
            <p className="section-text">{area.excerpt || area.short_description || area.note}</p>
            <a className="back-to-listings-link" href={backHref}>
              Back to Prime Areas
            </a>
          </div>
        </section>

        <section className="section prime-area-editorial-section">
          <div className="prime-area-hero-card prime-area-editorial-hero">
            <div
              className="prime-area-detail-image"
              style={featuredImage ? { backgroundImage: `url("${featuredImage}")` } : undefined}
            ></div>
            <div className="prime-area-detail-copy">
              <p className="section-eyebrow">{area.short_title || area.area_name}</p>
              <h2>{area.area_name}</h2>
              {paragraphs(area.excerpt || area.full_description).map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="section prime-area-article-section">
          <div className="prime-area-article-layout">
            <article className="prime-area-article">
              <div className="prime-area-article-body" dangerouslySetInnerHTML={{ __html: articleBody }} />
            </article>
            <aside className="prime-area-sidebar">
              {highlights.length ? (
                <article className="contact-card prime-area-insight-card">
                  <p className="section-eyebrow">Quick Facts</p>
                  <h3>{area.area_name} highlights</h3>
                  <div className="area-note-list">
                    {highlights.map((highlight) => (
                      <span key={highlight}>{highlight}</span>
                    ))}
                  </div>
                </article>
              ) : null}
              <article className="contact-card prime-area-insight-card">
                <p className="section-eyebrow">Editorial Guide</p>
                <h3>Area overview</h3>
                {paragraphs(area.lifestyle_text || area.short_description).map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </article>
              <article className="contact-card prime-area-insight-card">
                <p className="section-eyebrow">Market Perspective</p>
                <h3>Investment analysis</h3>
                {paragraphs(area.investment_analysis || area.full_description).map((text) => (
                  <p key={text}>{text}</p>
                ))}
              </article>
            </aside>
          </div>
        </section>

        {relatedProperties.length ? (
          <section className="section listing-group">
            <div className="section-header listing-group-header">
              <p className="section-eyebrow">Related Listings</p>
              <h2>Available Properties in {area.area_name}</h2>
            </div>
            <AreaPropertyFilters
              properties={relatedProperties}
              areaName={area.area_name}
              sourcePage={`Prime Area Insight: ${area.area_name}`}
              groupByBuilding
              initialVisiblePerGroup={3}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
