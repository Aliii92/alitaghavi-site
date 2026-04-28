import AreaPropertyFilters from "./AreaPropertyFilters";
import ResponsiveNavbar from "./ResponsiveNavbar";
import { readAreas } from "../lib/areas.js";
import {
  isReadyProperty,
  isResaleOffPlanProperty,
  isPubliclyVisibleProperty,
  matchesAreaSlug,
  normalizeAreaSlug,
  normalizeProperty,
  readProperties
} from "../lib/properties.js";
import {
  offPlanProjectsPathFor,
  readyPropertiesPathFor,
  resaleOffPlanPathFor
} from "../lib/public-context.js";
import { localizePath } from "../lib/locale";
import { getRequestLocale } from "../lib/server-locale";
import { hasSupabaseServerConfig, supabaseSelect } from "../lib/supabase-server.js";

const visibleAreaSlugs = ["palm-jumeirah", "downtown", "bluewaters", "meydan"];
const primaryAreaNames = new Set(["Palm Jumeirah", "Downtown", "Bluewaters", "Meydan"]);
const promotionThreshold = 4;
const primaryAreaFallbacks = {
  "palm-jumeirah": {
    name: "Palm Jumeirah",
    note: "Explore curated ready properties in Palm Jumeirah."
  },
  downtown: {
    name: "Downtown",
    note: "Explore curated ready properties in Downtown."
  },
  bluewaters: {
    name: "Bluewaters",
    note: "Explore curated ready properties in Bluewaters."
  },
  meydan: {
    name: "Meydan",
    note: "Explore curated ready properties in Meydan."
  }
};

function slugifyArea(value) {
  return String(value || "area")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizedSlugToAreaName(areaSlug) {
  const slug = String(areaSlug || "").trim().toLowerCase();
  if (!slug) return "";
  if (primaryAreaFallbacks[slug]?.name) return primaryAreaFallbacks[slug].name;

  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function groupByArea(properties) {
  const groups = new Map();

  (Array.isArray(properties) ? properties : []).forEach((property) => {
    const area = String(property?.area || "").trim() || "Other Areas";
    const areaSlug = normalizeAreaSlug(area) || "other-areas";
    if (!groups.has(areaSlug)) groups.set(areaSlug, { name: area, items: [] });
    groups.get(areaSlug).items.push(property);
  });

  return groups;
}

function promotedAreaNames(properties) {
  return new Set(
    [...groupByArea(properties).entries()]
      .filter(([, group]) => !primaryAreaNames.has(group.name) && group.items.length >= promotionThreshold)
      .map(([, group]) => group.name)
  );
}

function inventoryConfig(inventoryType, locale = "en") {
  const isFa = locale === "fa";
  if (inventoryType === "resale-off-plan") {
    return {
      eyebrow: isFa ? "ری‌سیل آف‌پلن" : "Resale Off-Plan",
      heading: isFa ? "واحدهای ری‌سیل آف‌پلن موجود در" : "Available Resale Off-Plan Units in",
      otherAreasNote: isFa ? "فرصت‌های منتخب ری‌سیل آف‌پلن در سایر مناطق دبی." : "Curated resale off-plan opportunities across additional Dubai locations.",
      emptyBody: isFa ? "هنوز لیستینگی برای این منطقه موجود نیست." : "No listings available in this area yet."
    };
  }

  return {
    eyebrow: isFa ? "املاک آماده" : "Ready Properties",
    heading: isFa ? "املاک موجود در" : "Available Properties in",
    otherAreasNote: isFa ? "املاک آماده منتخب در سایر مناطق دبی." : "Curated ready properties across additional Dubai locations.",
    emptyBody: isFa ? "هنوز لیستینگی برای این منطقه موجود نیست." : "No listings available in this area yet."
  };
}

function filterPropertiesByInventory(properties, inventoryType) {
  const visibleProperties = Array.isArray(properties) ? properties.filter(isPubliclyVisibleProperty) : [];
  if (inventoryType === "resale-off-plan") return visibleProperties.filter(isResaleOffPlanProperty);
  return visibleProperties.filter(isReadyProperty);
}

function resolveSelectedArea(areaSlug, areas, properties = [], inventoryType = "ready") {
  const config = inventoryConfig(inventoryType);

  if (areaSlug === "other-areas") {
    return {
      slug: "other-areas",
      name: "Other Areas",
      note: config.otherAreasNote,
      notes: ["Additional Dubai locations", "Curated opportunities", "Advisor-led selection"]
    };
  }

  const safeAreas = Array.isArray(areas) ? areas : [];
  const existing = safeAreas.find((item) => item?.slug === areaSlug || item?.id === areaSlug);
  const propertyMatches = (Array.isArray(properties) ? properties : []).filter((property) =>
    matchesAreaSlug(property, areaSlug, existing?.aliases)
  );
  const derivedAreaName =
    existing?.name ||
    existing?.area_name ||
    propertyMatches[0]?.area ||
    primaryAreaFallbacks[areaSlug]?.name ||
    "";
  const derivedNote =
    existing?.note ||
    existing?.short_description ||
    primaryAreaFallbacks[areaSlug]?.note ||
    (derivedAreaName ? `Curated opportunities in ${derivedAreaName}.` : "");

  if (existing) {
    return {
      ...existing,
      slug: existing.slug || areaSlug,
      name: derivedAreaName,
      note: derivedNote
    };
  }

  if (propertyMatches.length || primaryAreaFallbacks[areaSlug]) {
    return {
      slug: areaSlug,
      name: derivedAreaName || primaryAreaFallbacks[areaSlug]?.name || areaSlug,
      note: derivedNote || (derivedAreaName ? `Curated opportunities in ${derivedAreaName}.` : "")
    };
  }

  const promotedName = [...promotedAreaNames(properties)].find((areaName) => slugifyArea(areaName) === areaSlug);
  if (!promotedName) {
    const fallbackName = normalizedSlugToAreaName(areaSlug);
    return fallbackName
      ? {
          slug: areaSlug,
          name: fallbackName,
          note: `Curated opportunities in ${fallbackName}.`
        }
      : null;
  }

  return {
    slug: slugifyArea(promotedName),
    name: promotedName,
    note: `Curated opportunities in ${promotedName}.`
  };
}

function NavBar({ owner = "ali", locale = "en" }) {
  const homeHref = localizePath(owner === "negin" ? "/negin" : "/", locale);
  const readyHref = localizePath(readyPropertiesPathFor(owner), locale);
  const offPlanHref = localizePath(offPlanProjectsPathFor(owner), locale);
  const resaleHref = localizePath(resaleOffPlanPathFor(owner), locale);
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
    <ResponsiveNavbar
      brandLabel={copy.brand}
      brandHref={homeHref}
      links={[
        { href: readyHref, label: copy.ready },
        { href: offPlanHref, label: copy.projects },
        { href: resaleHref, label: copy.resale },
        { href: `${homeHref}#areas`, label: copy.areas },
        { href: localizePath(owner === "ali" ? "/negin" : "/", locale), label: copy.otherAdvisor },
        { href: `${homeHref}#contact`, label: copy.contact },
        { href: `${homeHref}#advisory`, label: copy.about }
      ]}
      locale={locale}
    />
  );
}

function SafeAreaPage({
  owner = "ali",
  locale = "en",
  config,
  title,
  message,
  overviewPath
}) {
  return (
    <main className="luxury-page listings-page">
      <NavBar owner={owner} locale={locale} />
      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">{config?.eyebrow || (locale === "fa" ? "لیست املاک منطقه" : "Area listings")}</p>
            <h1>{title}</h1>
            <p className="section-text">{message}</p>
            <a className="button secondary-button back-to-listings-button" href={overviewPath}>
              {locale === "fa" ? "بازگشت به همه مناطق" : "Back to All Areas"}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

export async function buildAreaStaticParams(inventoryType = "ready") {
  try {
    const properties = filterPropertiesByInventory(await readProperties(), inventoryType);
    const promotedSlugs = [...promotedAreaNames(properties)].map(slugifyArea);
    return [...visibleAreaSlugs, ...promotedSlugs, "other-areas"].map((area) => ({ area }));
  } catch (error) {
    console.error("[buildAreaStaticParams] Failed to load area params:", error);
    return [...visibleAreaSlugs, "other-areas"].map((area) => ({ area }));
  }
}

export async function buildAreaMetadata(areaSlug, owner = "ali", inventoryType = "ready") {
  const locale = await getRequestLocale();
  let areas = [];
  let properties = [];

  try {
    const loadedAreas = await readAreas();
    areas = (Array.isArray(loadedAreas) ? loadedAreas : []).filter((item) => item?.owner === owner);
  } catch (error) {
    console.error(`[buildAreaMetadata:${areaSlug}] Failed to load areas:`, error);
  }

  try {
    properties = filterPropertiesByInventory(await readProperties(), inventoryType);
  } catch (error) {
    console.error(`[buildAreaMetadata:${areaSlug}] Failed to load properties:`, error);
  }

  const selectedArea = resolveSelectedArea(areaSlug, areas, properties, inventoryType);
  const sectionLabel = inventoryType === "resale-off-plan"
    ? (locale === "fa" ? "ری‌سیل آف‌پلن" : "Resale Off-Plan")
    : (locale === "fa" ? "املاک آماده" : "Ready Properties");
  const title = selectedArea ? `${selectedArea.name} ${sectionLabel}` : "Dubai Area Properties";
  const description = selectedArea?.note || `Browse curated ${sectionLabel.toLowerCase()} in Dubai's prime areas.`;
  const base = inventoryType === "resale-off-plan"
    ? resaleOffPlanPathFor(owner)
    : owner === "negin"
      ? `/negin/areas/${areaSlug}`
      : `/areas/${areaSlug}`;
  const url = inventoryType === "resale-off-plan"
    ? `${resaleOffPlanPathFor(owner)}/${areaSlug}`
    : base;

  return {
    title,
    description,
    alternates: {
      canonical: selectedArea ? url : base
    },
    openGraph: {
      title,
      description,
      url: selectedArea ? url : base
    }
  };
}

export default async function AreaInventoryPage({ params, owner = "ali", inventoryType = "ready" }) {
  const locale = await getRequestLocale();
  const config = inventoryConfig(inventoryType, locale);
  const overviewPath = inventoryType === "resale-off-plan"
    ? resaleOffPlanPathFor(owner)
    : readyPropertiesPathFor(owner);

  try {
    const { area } = await params;
    const normalizedArea = normalizeAreaSlug(area);
    const normalizedAreaName = normalizedSlugToAreaName(normalizedArea);
    const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const hasSupabaseAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    let areas = [];
    let areaLoadError = "";
    try {
      const loadedAreas = await readAreas();
      areas = (Array.isArray(loadedAreas) ? loadedAreas : []).filter((item) => item?.owner === owner);
    } catch (error) {
      areaLoadError = error?.message || "Unable to load area data.";
      console.error(`[public-area:${area}] Failed to load areas:`, error);
    }

    console.log("areaSlug:", area);
    console.log("normalizedArea:", normalizedAreaName);
    console.log("Supabase URL exists:", hasSupabaseUrl);
    console.log("Supabase KEY exists:", hasSupabaseAnonKey);

    let readyAndResaleProperties = [];
    let propertySource = "supabase";
    let propertyLoadError = "";
    let supabaseData = null;
    let supabaseError = null;
    try {
      if (inventoryType === "ready" && hasSupabaseServerConfig()) {
        supabaseData = await supabaseSelect("properties", {
          area: `eq.${normalizedAreaName}`,
          order: "id.asc"
        });
        readyAndResaleProperties = (Array.isArray(supabaseData) ? supabaseData : []).map((row) =>
          normalizeProperty(
            {
              ...row,
              category: row?.category || row?.inventory_type || "ready",
              inventory_type: row?.inventory_type || row?.category || "Ready"
            },
            row?.id
          )
        );
      } else {
        readyAndResaleProperties = await readProperties({
          allowFallback: false,
          inventoryType: inventoryType === "resale-off-plan" ? "resale-off-plan" : "ready"
        });
      }
    } catch (error) {
      supabaseError = error;
      propertyLoadError = error?.message || "Unable to load properties.";
      console.error(`[public-area:${area}] Supabase error:`, error);
      console.warn(`[public-area:${area}] Supabase unavailable, falling back to local JSON:`, error?.message || error);
      try {
        readyAndResaleProperties = await readProperties({
          allowFallback: true,
          inventoryType: inventoryType === "resale-off-plan" ? "resale-off-plan" : "ready"
        });
        propertySource = "local-fallback";
      } catch (fallbackError) {
        propertyLoadError = fallbackError?.message || propertyLoadError;
        console.error(`[public-area:${area}] Local fallback failed:`, fallbackError);
        readyAndResaleProperties = [];
        propertySource = "unavailable";
      }
    }
    console.log("data:", supabaseData);
    console.log("error:", supabaseError);

    const allProperties = filterPropertiesByInventory(readyAndResaleProperties, inventoryType);
    const selectedArea = resolveSelectedArea(area, areas, allProperties, inventoryType);
    const promotedNames = promotedAreaNames(allProperties);
    const areaProperties = selectedArea
      ? selectedArea.slug === "other-areas"
        ? allProperties.filter((property) => {
            const propertyAreaName = String(property?.area || "").trim() || "Other Areas";
            return !primaryAreaNames.has(propertyAreaName) && !promotedNames.has(propertyAreaName);
          })
        : allProperties.filter((property) => matchesAreaSlug(property, selectedArea.slug, selectedArea.aliases))
      : [];

    console.log(
      `[public-area:${area}] normalizedArea=${normalizedArea} supabaseUrlExists=${hasSupabaseUrl} supabaseAnonKeyExists=${hasSupabaseAnonKey} source=${propertySource} fetchedListings=${readyAndResaleProperties.length} afterInventoryFilter=${allProperties.length} afterAreaFilter=${areaProperties.length}`
    );
    if (propertyLoadError) console.error(`[public-area:${area}] Property load error:`, propertyLoadError);
    if (areaLoadError) console.error(`[public-area:${area}] Area load error:`, areaLoadError);

    if (!selectedArea) {
      return (
        <SafeAreaPage
          owner={owner}
          locale={locale}
          config={config}
          title={locale === "fa" ? "لیست املاک منطقه" : "Area listings"}
          message={locale === "fa" ? "در حال حاضر امکان بارگذاری این منطقه وجود ندارد." : "We could not load this area right now."}
          overviewPath={overviewPath}
        />
      );
    }

    return (
      <main className="luxury-page listings-page">
        <NavBar owner={owner} locale={locale} />

        <div className="content-shell listings-page-shell">
          <section className="section listings-intro-section">
            <div className="section-header centered listings-page-header">
              <p className="section-eyebrow">{config.eyebrow}</p>
              <h1>{config.heading} {selectedArea.name}</h1>
              <p className="section-text">{selectedArea.note}</p>
              {selectedArea.notes?.length ? (
                <div className="area-note-list">
                  {selectedArea.notes.map((note) => (
                    <span key={note}>{note}</span>
                  ))}
                </div>
              ) : null}
              <a className="back-to-listings-link" href={overviewPath}>
                Back to all areas
              </a>
            </div>
          </section>

          <section className="section listing-group">
            <div className="section-header listing-group-header">
              <p className="section-eyebrow">{config.eyebrow}</p>
              <h2>{config.heading} {selectedArea.name}</h2>
            </div>

            {areaProperties.length ? (
              <AreaPropertyFilters
                properties={areaProperties}
                areaName={selectedArea.name || primaryAreaFallbacks[selectedArea.slug]?.name || selectedArea.slug}
                advisorName={owner === "negin" ? "Negin Mohamadi" : "Ali Taghavi"}
                phoneNumber={owner === "negin" ? "971505996547" : "971522950316"}
                owner={owner}
                sourcePage={`${owner === "negin" ? "Negin" : "Ali"} ${config.eyebrow} Area Page: ${selectedArea.name || selectedArea.slug}`}
                redirectBase={overviewPath}
                redirectBaseByCategory={{
                  all: owner === "negin" ? "/negin/listings" : "/listings",
                  ready: owner === "negin" ? `/negin/areas/${selectedArea.slug}` : `/areas/${selectedArea.slug}`,
                  "off-plan": offPlanProjectsPathFor(owner),
                  "resale-off-plan": resaleOffPlanPathFor(owner)
                }}
                defaultCategory={inventoryType}
                showResults
                groupByBuilding
                initialVisiblePerGroup={3}
                locale={locale}
              />
            ) : (
              <article className="contact-card empty-listings-card">
                <h3>{locale === "fa" ? `هنوز لیستینگی در ${selectedArea.name} موجود نیست.` : "No listings available in this area yet."}</h3>
                <p>{config.emptyBody}</p>
              </article>
            )}
          </section>
        </div>

        <a
          className="floating-whatsapp"
          href={`https://wa.me/${owner === "negin" ? "971505996547" : "971522950316"}`}
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
  } catch (error) {
    console.error("[AreaInventoryPage] Fatal area page error:", error);
    return (
      <SafeAreaPage
        owner={owner}
        locale={locale}
        config={config}
        title={locale === "fa" ? "لیست املاک منطقه" : "Area listings"}
        message={locale === "fa" ? "در حال حاضر امکان بارگذاری این منطقه وجود ندارد." : "We could not load this area right now."}
        overviewPath={overviewPath}
      />
    );
  }
}
