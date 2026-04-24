import LeadWhatsAppButton from "./LeadWhatsAppButton";
import AreaPropertyFilters from "./AreaPropertyFilters";
import LanguageSwitcher from "./LanguageSwitcher";
import { buildLeadPayload, buildPropertyWhatsAppUrl } from "../lib/whatsapp.js";
import { offPlanProjectsPathFor, readyPropertiesPathFor, resaleOffPlanPathFor } from "../lib/public-context.js";
import { readProperties } from "../lib/properties.js";
import { projectToProperty, readProjects } from "../lib/projects.js";
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
        brand: "املاک لوکس دبی",
        ready: "املاک آماده",
        projects: "پروژه‌های آف‌پلن",
        resale: "ری‌سیل آف‌پلن",
        areas: "مناطق برتر",
        contact: "ارتباط",
        about: "درباره من",
        otherAdvisor: owner === "ali" ? "نگین محمدی" : "علی تقوی"
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
    <div className="nav-shell">
      <nav className="topbar">
        <a className="brand" href={homeHref}>{copy.brand}</a>
        <div className="nav-links">
          <a href={readyHref}>{copy.ready}</a>
          <a href={projectsHref}>{copy.projects}</a>
          <a href={resaleHref}>{copy.resale}</a>
          <a href={`${homeHref}#areas`}>{copy.areas}</a>
          {owner === "ali" ? <a href={localizePath("/negin", locale)}>{copy.otherAdvisor}</a> : null}
          <a href={`${homeHref}#contact`}>{copy.contact}</a>
          <a href={`${homeHref}#advisory`}>{copy.about}</a>
        </div>
        <LanguageSwitcher locale={locale} />
      </nav>
    </div>
  );
}

function ProjectListingCard({ project, contextOwner = "ali" }) {
  const propertyPayload = projectToProperty(project);
  const advisorLabel = contextOwner === "negin" ? "Negin" : "Ali";
  const phoneNumber = contextOwner === "negin" ? "971505996547" : "971522950316";
  const sourcePage = contextOwner === "negin" ? "Negin Off-Plan Projects Page" : "Ali Off-Plan Projects Page";
  const whatsappHref = buildPropertyWhatsAppUrl({
    property: propertyPayload,
    advisor: advisorLabel,
    advisorOwner: contextOwner,
    locale: "en",
    phoneNumber
  });
  const lead = buildLeadPayload({
    property: propertyPayload,
    advisor: advisorLabel,
    advisorOwner: contextOwner,
    locale: "en",
    phoneNumber,
    sourcePage
  });
  const displayPrice = formatPriceDisplay(project.startingPrice);

  return (
    <article className="listing-card compact-listing-card">
      {project.image ? (
        <div className="listing-image compact-listing-image" style={{ backgroundImage: `url("${project.image}")` }}></div>
      ) : (
        <div className="listing-image compact-listing-image project-one"></div>
      )}
      <div className="listing-content">
        <span className="listing-label">{project.handoverDate || "Off-Plan"}</span>
        <span className="listing-badge">{project.developer}</span>
        <h3>{project.title}</h3>
        <p className="listing-description">{[project.area, project.subArea].filter(Boolean).join(" / ")}</p>
        <p className="compact-listing-detail">{project.description}</p>
        <div className="price-row">
          <span>Starting Price</span>
          <strong>{displayPrice}</strong>
        </div>
        <LeadWhatsAppButton className="button whatsapp-button" href={whatsappHref} lead={lead}>
          Request Project Details
        </LeadWhatsAppButton>
      </div>
    </article>
  );
}

export default async function ProjectsInventoryPage({ searchParams, owner = "ali" }) {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const hasSearch = searchKeys.some((key) => params?.[key]);
  const projects = await readProjects();
  const projectProperties = projects.map(projectToProperty);
  const searchableInventory = [...(await readProperties()), ...projectProperties];
  const phoneNumber = owner === "negin" ? "971505996547" : "971522950316";
  const homeHref = owner === "negin" ? "/negin" : "/";
  const projectsHref = offPlanProjectsPathFor(owner);

  return (
    <main className="luxury-page listings-page">
      <NavBar owner={owner} locale={locale} />

      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">{locale === "fa" ? "پروژه‌های آف‌پلن لوکس" : "Luxury Off-Plan Projects"}</p>
            <h1>{locale === "fa" ? "پروژه‌های آف‌پلن بیشتر را بررسی کنید" : "Explore More Off-Plan Projects"}</h1>
            <p className="section-text">
              {locale === "fa"
                ? "منتخبی از فرصت‌های پریمیوم آف‌پلن در مناطق برندد، واترفرانت و رو به رشد دبی."
                : "A curated selection of premium off-plan opportunities across Dubai's branded, waterfront, and high-growth locations."}
            </p>
            <a className="back-to-listings-link" href={homeHref}>
              {locale === "fa" ? "بازگشت به پروژه‌های صفحه اصلی" : "Back to homepage projects"}
            </a>
          </div>
        </section>

        <section className="section listing-group">
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
            intro={locale === "fa" ? "پروژه‌های آف‌پلن را بر اساس منطقه، توسعه‌دهنده، تعداد خواب، بودجه و زمان تحویل جست‌وجو کنید." : "Search off-plan projects by area, developer, bedroom mix, budget, and handover date."}
            locale={locale}
          />

          {!hasSearch && projects.length ? (
            <div className="three-column-grid all-listings-grid">
              {projects.map((project) => (
                <ProjectListingCard key={project.id} project={project} contextOwner={owner} />
              ))}
            </div>
          ) : !hasSearch ? (
            <article className="contact-card empty-listings-card">
              <h3>{locale === "fa" ? "فرصت‌های آف‌پلن منتخب به‌زودی اضافه می‌شوند" : "Curated off-plan opportunities coming soon"}</h3>
              <p>{locale === "fa" ? "پروژه‌های آف‌پلن جدید از داشبورد ادمین اضافه می‌شوند و به‌صورت خودکار اینجا نمایش داده خواهند شد." : "New off-plan projects can be added from the admin dashboard and will appear here automatically."}</p>
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
