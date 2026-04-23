import { getAreaGroup, getAreaGroups, getPropertyGroup, getPropertyGroups, whatsappNumber } from "../../../lib/properties";
import AreaPropertyCard from "../../../components/AreaPropertyCard";
import BuildingGroupedListings from "../../../components/BuildingGroupedListings";

function NavBar() {
  return (
    <div className="nav-shell">
      <nav className="topbar">
        <a className="brand" href="/">
          Ali Taghavi
        </a>
        <div className="nav-links">
          <a href="/ready-properties">Ready Properties</a>
          <a href="/off-plan-projects">Off-Plan Projects</a>
          <a href="/#areas">Prime Areas</a>
          <a href="/negin">Negin Mohamadi</a>
          <a href="/#contact">Contact</a>
          <a href="/#advisory">About Me</a>
        </div>
        <div className="language-links">
          <span className="lang-link active">EN</span>
          <span className="lang-divider">|</span>
          <span className="lang-link">FA</span>
        </div>
      </nav>
    </div>
  );
}

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const areaGroups = await getAreaGroups();
  const buildingGroups = await getPropertyGroups();
  return [...areaGroups, ...buildingGroups].map((group) => ({ slug: group.slug }));
}

export default async function AreaListingsPage({ params }) {
  const { slug } = await params;
  const areaGroup = await getAreaGroup(slug);
  const buildingGroup = areaGroup ? null : await getPropertyGroup(slug);
  const group = areaGroup || buildingGroup;

  if (!group) {
    return (
      <main className="luxury-page listings-page">
        <NavBar />
        <div className="content-shell listings-page-shell">
          <section className="section listings-intro-section">
            <div className="section-header centered listings-page-header">
              <p className="section-eyebrow">Listings</p>
              <h2>Collection not found</h2>
              <p className="section-text">Return to the listings overview to browse available opportunities.</p>
              <a className="button secondary-button back-to-listings-button" href="/ready-properties">
                Back to Listings
              </a>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="luxury-page listings-page">
      <NavBar />

      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">{areaGroup ? "Area / District" : "Available Properties"}</p>
            <h2>{group.name}</h2>
            <p className="section-text">{group.note}</p>
            <a className="back-to-listings-link" href="/ready-properties">
              Back to all areas
            </a>
          </div>
        </section>

        {areaGroup ? (
          group.items.length ? (
            <section className="section listing-group">
              <BuildingGroupedListings
                properties={group.items}
                areaName={group.name}
                advisorName="Ali Taghavi"
                sourcePage={`Ali Listings Area: ${group.name}`}
                phoneNumber={whatsappNumber}
                owner="ali"
                initialVisiblePerGroup={3}
              />
            </section>
          ) : (
            <section className="section listing-group">
              <article className="contact-card empty-listings-card">
                <h3>Curated opportunities coming soon</h3>
                <p>New opportunities for this area can be added from the admin dashboard and will appear here automatically.</p>
              </article>
            </section>
          )
        ) : (
          <section className="section listing-group">
            <div className="three-column-grid all-listings-grid">
              {group.items.map((item) => (
                <AreaPropertyCard
                  key={item.id}
                  property={item}
                  areaName={group.name}
                  advisorName="Ali Taghavi"
                  sourcePage={`Ali Listings Collection: ${group.name}`}
                  phoneNumber={whatsappNumber}
                  owner="ali"
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <a
        className="floating-whatsapp"
        href="https://wa.me/971522950316"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open WhatsApp chat with Ali Taghavi"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16.04 3C8.88 3 3.06 8.82 3.06 15.98c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75a12.9 12.9 0 0 0 6.36 1.62h.01c7.16 0 12.98-5.82 12.98-12.98C29.03 8.82 23.2 3 16.04 3Zm0 23.66h-.01a10.76 10.76 0 0 1-5.48-1.5l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.74 10.74 0 0 1-1.65-5.73c0-5.89 4.8-10.68 10.7-10.68 2.85 0 5.53 1.11 7.55 3.13a10.61 10.61 0 0 1 3.12 7.55c0 5.89-4.8 10.68-10.69 10.68Zm5.86-8c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.72.16-.21.32-.82 1.05-1 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.77 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
    </main>
  );
}
