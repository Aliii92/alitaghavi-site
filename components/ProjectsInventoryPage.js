import LeadWhatsAppButton from "./LeadWhatsAppButton";
import AreaPropertyFilters from "./AreaPropertyFilters";
import ResponsiveNavbar from "./ResponsiveNavbar";
import ProjectImage from "./ProjectImage";
import { buildLeadPayload, buildPropertyWhatsAppUrl } from "../lib/whatsapp.js";
import { offPlanProjectsPathFor, readyPropertiesPathFor, resaleOffPlanPathFor } from "../lib/public-context.js";
import { readProperties } from "../lib/properties.js";
import { projectToProperty, readProjects } from "../lib/projects.js";
import { resolveProjectImage } from "../lib/project-images.js";
import { formatPriceDisplay } from "../lib/price.js";
import { localizePath } from "../lib/locale";
import { getRequestLocale } from "../lib/server-locale";

const searchKeys = ["q", "category", "bedrooms", "property_type", "min_price", "max_price", "handover"];

function NavBar({ owner = "ali", locale = "en" }) {
  const readyHref = localizePath(readyPropertiesPathFor(owner), locale);
  const projectsHref = localizePath(offPlanProjectsPathFor(owner), locale);
  const resaleHref = localizePath(resaleOffPlanPathFor(owner), locale);
  const homeHref = localizePath(owner === "negin" ? "/negin" : "/", locale);
  const copy = locale === "fa"
    ? {
        brand: "Ø§Ù…Ù„Ø§Ú© Ù„ÙˆÚ©Ø³ Ø¯Ø¨ÛŒ",
        ready: "Ø§Ù…Ù„Ø§Ú© Ø¢Ù…Ø§Ø¯Ù‡",
        projects: "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø¢Ùâ€ŒÙ¾Ù„Ù†",
        resale: "Ø±ÛŒâ€ŒØ³ÛŒÙ„ Ø¢Ùâ€ŒÙ¾Ù„Ù†",
        areas: "Ù…Ù†Ø§Ø·Ù‚ Ø¨Ø±ØªØ±",
        contact: "Ø§Ø±ØªØ¨Ø§Ø·",
        about: "Ø¯Ø±Ø¨Ø§Ø±Ù‡ Ù…Ù†",
        otherAdvisor: owner === "ali" ? "Ù†Ú¯ÛŒÙ† Ù…Ø­Ù…Ø¯ÛŒ" : "Ø¹Ù„ÛŒ ØªÙ‚ÙˆÛŒ"
      }
    : {
        brand: "Dubai Luxury Properties",
        ready: "Ready Properties",
        projects: "Off-Plan Projects",
        resale: "Resale Off-Plan",
        areas: "Prime Areas",
        contact: "Contact",
        about: "About Me",
        otherAdvisor: owner === "ali" ? "Negin Mohamadi" : "Ali Taghavi"
      };

  return (
    <ResponsiveNavbar
      brandLabel={copy.brand}
      brandHref={homeHref}
      links={[
        { href: readyHref, label: copy.ready },
        { href: projectsHref, label: copy.projects },
        { href: resaleHref, label: copy.resale },
        { href: `${homeHref}#areas`, label: copy.areas },
        ...(owner === "ali" ? [{ href: localizePath("/negin", locale), label: copy.otherAdvisor }] : []),
        { href: `${homeHref}#contact`, label: copy.contact },
        { href: `${homeHref}#advisory`, label: copy.about }
      ]}
      locale={locale}
    />
  );
}

function ProjectListingCard({ project, contextOwner = "ali", locale = "en" }) {
  const propertyPayload = projectToProperty(project);
  const advisorLabel = contextOwner === "negin" ? "Negin" : "Ali";
  const phoneNumber = contextOwner === "negin" ? "971505996547" : "971522950316";
  const sourcePage = contextOwner === "negin" ? "Negin Off-Plan Projects Page" : "Ali Off-Plan Projects Page";
  const whatsappHref = buildPropertyWhatsAppUrl({
    property: propertyPayload,
    advisor: advisorLabel,
    advisorOwner: contextOwner,
    locale,
    phoneNumber
  });
  const lead = buildLeadPayload({
    property: propertyPayload,
    advisor: advisorLabel,
    advisorOwner: contextOwner,
    locale,
    phoneNumber,
    sourcePage
  });
  const displayPrice = formatPriceDisplay(project.startingPrice, locale);
  const imageSrc = resolveProjectImage(project);
  const isFa = locale === "fa";

  if (process.env.NODE_ENV !== "production") {
    console.log("[off-plan-project-card]", project);
  }

  return (
    <article className="listing-card compact-listing-card">
      <ProjectImage
        className="listing-image compact-listing-image project-card-image"
        src={imageSrc}
        alt={project.title || "Off-plan project"}
      />
      <div className="listing-content">
        <span className="listing-label">{project.handoverDate || (isFa ? "آف پلن" : "Off-Plan")}</span>
        <span className="listing-badge">{project.developer || (isFa ? "توسعه‌دهنده" : "Developer")}</span>
        <h3>{project.title || (isFa ? "پروژه بدون عنوان" : "Untitled project")}</h3>
        <p className="listing-description">{[project.area, project.subArea].filter(Boolean).join(" / ") || (isFa ? "منطقه مشخص نشده" : "Area not specified")}</p>
        <p className="compact-listing-detail">{project.description || (isFa ? "جزئیات پروژه به‌زودی تکمیل می‌شود." : "Project details will be completed soon.")}</p>
        <div className="price-row">
          <span>{isFa ? "شروع قیمت" : "Starting Price"}</span>
          <strong>{displayPrice}</strong>
        </div>
        <LeadWhatsAppButton className="button whatsapp-button" href={whatsappHref} lead={lead}>
          {isFa ? "دریافت جزئیات پروژه" : "Request Project Details"}
        </LeadWhatsAppButton>
      </div>
    </article>
  );
}

export default async function ProjectsInventoryPage({ searchParams, owner = "ali" }) {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const hasSearch = searchKeys.some((key) => params?.[key]);
  const isFa = locale === "fa";
  console.log("[ProjectsInventoryPage] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "(missing)");
  console.log("[ProjectsInventoryPage] Supabase anon key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let projects = [];
  let searchableInventory = [];
  let loadError = "";

  try {
    projects = await readProjects({ allowFallback: false });
    const projectProperties = projects.map(projectToProperty);
    const publicProperties = await readProperties({ allowFallback: false, inventoryType: "all" });
    searchableInventory = [...publicProperties, ...projectProperties];
    console.log("[ProjectsInventoryPage] projects fetched:", projects.length);
  } catch (error) {
    console.error("[ProjectsInventoryPage] failed to load live inventory:", error);
    loadError = error?.message || "Could not load off-plan projects right now.";
  }

  const phoneNumber = owner === "negin" ? "971505996547" : "971522950316";
  const homeHref = owner === "negin" ? "/negin" : "/";
  const projectsHref = offPlanProjectsPathFor(owner);

  return (
    <main className="luxury-page listings-page">
      <NavBar owner={owner} locale={locale} />

      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">{isFa ? "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø¢Ùâ€ŒÙ¾Ù„Ù† Ù„ÙˆÚ©Ø³" : "Luxury Off-Plan Projects"}</p>
            <h1>{isFa ? "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø¢Ùâ€ŒÙ¾Ù„Ù† Ø¨ÛŒØ´ØªØ± Ø±Ø§ Ø¨Ø±Ø±Ø³ÛŒ Ú©Ù†ÛŒØ¯" : "Explore More Off-Plan Projects"}</h1>
            <p className="section-text">
              {isFa
                ? "Ù…Ù†ØªØ®Ø¨ÛŒ Ø§Ø² ÙØ±ØµØªâ€ŒÙ‡Ø§ÛŒ Ù¾Ø±ÛŒÙ…ÛŒÙˆÙ… Ø¢Ùâ€ŒÙ¾Ù„Ù† Ø¯Ø± Ù…Ù†Ø§Ø·Ù‚ Ø¨Ø±Ù†Ø¯Ø¯ØŒ ÙˆØ§ØªØ±ÙØ±Ø§Ù†Øª Ùˆ Ø±Ùˆ Ø¨Ù‡ Ø±Ø´Ø¯ Ø¯Ø¨ÛŒ."
                : "A curated selection of premium off-plan opportunities across Dubai's branded, waterfront, and high-growth locations."}
            </p>
            <a className="back-to-listings-link" href={homeHref}>
              {isFa ? "Ø¨Ø§Ø²Ú¯Ø´Øª Ø¨Ù‡ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ ØµÙØ­Ù‡ Ø§ØµÙ„ÛŒ" : "Back to homepage projects"}
            </a>
          </div>
        </section>

        <section className="section listing-group">
          {!loadError ? (
            <AreaPropertyFilters
              properties={searchableInventory}
              areaName="Dubai"
              sourcePage={owner === "negin" ? "Negin Off-Plan Projects Search" : "Ali Off-Plan Projects Search"}
              redirectBase={projectsHref}
              redirectBaseByCategory={{
                all: owner === "negin" ? "/negin/listings" : "/listings",
                ready: readyPropertiesPathFor(owner),
                "off-plan": offPlanProjectsPathFor(owner),
                "resale-off-plan": resaleOffPlanPathFor(owner)
              }}
              mode={hasSearch ? "results" : "redirect"}
              defaultCategory="off-plan"
              intro={isFa ? "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø¢Ùâ€ŒÙ¾Ù„Ù† Ø±Ø§ Ø¨Ø± Ø§Ø³Ø§Ø³ Ù…Ù†Ø·Ù‚Ù‡ØŒ ØªÙˆØ³Ø¹Ù‡â€ŒØ¯Ù‡Ù†Ø¯Ù‡ØŒ ØªØ¹Ø¯Ø§Ø¯ Ø®ÙˆØ§Ø¨ØŒ Ø¨ÙˆØ¯Ø¬Ù‡ Ùˆ Ø²Ù…Ø§Ù† ØªØ­ÙˆÛŒÙ„ Ø¬Ø³Øªâ€ŒÙˆØ¬Ùˆ Ú©Ù†ÛŒØ¯." : "Search off-plan projects by area, developer, bedroom mix, budget, and handover date."}
              locale={locale}
            />
          ) : null}

          {loadError ? (
            <article className="contact-card empty-listings-card">
              <h3>{isFa ? "Ø¨Ø§Ø±Ú¯Ø°Ø§Ø±ÛŒ Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ Ø¨Ø§ Ù…Ø´Ú©Ù„ Ù…ÙˆØ§Ø¬Ù‡ Ø´Ø¯" : "Could not load projects right now"}</h3>
              <p>{loadError}</p>
            </article>
          ) : !hasSearch && projects.length ? (
            <div className="three-column-grid all-listings-grid">
              {projects.map((project) => (
                <ProjectListingCard key={project.id} project={project} contextOwner={owner} locale={locale} />
              ))}
            </div>
          ) : !hasSearch ? (
            <article className="contact-card empty-listings-card">
              <h3>{isFa ? "ÙØ±ØµØªâ€ŒÙ‡Ø§ÛŒ Ø¢Ùâ€ŒÙ¾Ù„Ù† Ù…Ù†ØªØ®Ø¨ Ø¨Ù‡â€ŒØ²ÙˆØ¯ÛŒ Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯" : "Curated off-plan opportunities coming soon"}</h3>
              <p>{isFa ? "Ù¾Ø±ÙˆÚ˜Ù‡â€ŒÙ‡Ø§ÛŒ Ø¢Ùâ€ŒÙ¾Ù„Ù† Ø¬Ø¯ÛŒØ¯ Ø§Ø² Ø¯Ø§Ø´Ø¨ÙˆØ±Ø¯ Ø§Ø¯Ù…ÛŒÙ† Ø§Ø¶Ø§ÙÙ‡ Ù…ÛŒâ€ŒØ´ÙˆÙ†Ø¯ Ùˆ Ø¨Ù‡â€ŒØµÙˆØ±Øª Ø®ÙˆØ¯Ú©Ø§Ø± Ø§ÛŒÙ†Ø¬Ø§ Ù†Ù…Ø§ÛŒØ´ Ø¯Ø§Ø¯Ù‡ Ø®ÙˆØ§Ù‡Ù†Ø¯ Ø´Ø¯." : "New off-plan projects can be added from the admin dashboard and will appear here automatically."}</p>
            </article>
          ) : null}
        </section>
      </div>

      <a
        className="floating-whatsapp"
        href={`https://wa.me/${phoneNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open WhatsApp chat with ${owner === "negin" ? "Negin Mohamadi" : "Ali Taghavi"}`}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16.04 3C8.88 3 3.06 8.82 3.06 15.98c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75a12.9 12.9 0 0 0 6.36 1.62h.01c7.16 0 12.98-5.82 12.98-12.98C29.03 8.82 23.2 3 16.04 3Zm0 23.66h-.01a10.76 10.76 0 0 1-5.48-1.5l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.74 10.74 0 0 1-1.65-5.73c0-5.89 4.8-10.68 10.7-10.68 2.85 0 5.53 1.11 7.55 3.13a10.61 10.61 0 0 1 3.12 7.55c0 5.89-4.8 10.68-10.69 10.68Zm5.86-8c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.72.16-.21.32-.82 1.05-1 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.77 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
    </main>
  );
}
