import { redirect } from "next/navigation";
import AreaPropertyFilters from "./AreaPropertyFilters";
import ResponsiveNavbar from "./ResponsiveNavbar";
import {
  isReadyProperty,
  isResaleOffPlanProperty,
  isPubliclyVisibleProperty,
  normalizeProperty
} from "../lib/properties.js";
import {
  offPlanProjectsPathFor,
  readyPropertiesPathFor,
  resaleOffPlanPathFor
} from "../lib/public-context.js";
import { localizePath } from "../lib/locale";
import { getRequestLocale } from "../lib/server-locale";
import { hasSupabaseServerConfig, supabaseSelect } from "../lib/supabase-server.js";
import { areaNameFromSlug, readDynamicAreaNames } from "../lib/dynamic-areas.js";

const visibleAreaSlugs = ["palm-jumeirah", "downtown", "bluewaters", "meydan"];
const primaryAreaNames = new Set(["Palm Jumeirah", "Downtown", "Bluewaters", "Meydan"]);
const promotionThreshold = 4;

function slugifyArea(value) {
  return String(value || "area")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
        { href: `${owner === "negin" ? "/negin" : ""}/areas`, label: copy.areas },
        { href: localizePath(owner === "ali" ? "/negin" : "/", locale), label: copy.otherAdvisor },
        { href: `${homeHref}#contact`, label: copy.contact },
        { href: `${homeHref}#advisory`, label: copy.about }
      ]}
      locale={locale}
    />
  );
}

function SafeAreaPage({ owner = "ali", locale = "en", config, title, message, overviewPath }) {
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

function filterAreaProperties(properties, inventoryType) {
  const visible = (Array.isArray(properties) ? properties : []).filter(isPubliclyVisibleProperty);
  if (inventoryType === "resale-off-plan") return visible.filter(isResaleOffPlanProperty);
  return visible.filter(isReadyProperty);
}

function groupByArea(properties) {
  const groups = new Map();
  (Array.isArray(properties) ? properties : []).forEach((property) => {
    const area = String(property?.area || "").trim() || "Other Areas";
    if (!groups.has(area)) groups.set(area, []);
    groups.get(area).push(property);
  });
  return groups;
}

function promotedAreaNames(properties) {
  const grouped = groupByArea(properties);
  return new Set(
    [...grouped.entries()]
      .filter(([areaName, items]) => !primaryAreaNames.has(areaName) && items.length >= promotionThreshold)
      .map(([areaName]) => areaName)
  );
}

async function fetchPropertiesByAreaName(areaName) {
  if (!hasSupabaseServerConfig()) return { data: null, error: new Error("Supabase server configuration is missing.") };

  try {
    const data = await supabaseSelect("properties", {
      area: `eq.${areaName}`,
      order: "id.asc"
    });
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function buildAreaStaticParams() {
  try {
    const areaNames = await readDynamicAreaNames();
    const dynamicSlugs = areaNames.map(slugifyArea).filter(Boolean);
    return [...new Set([...visibleAreaSlugs, ...dynamicSlugs, "other-areas"])].map((area) => ({ area }));
  } catch (error) {
    console.error("[buildAreaStaticParams] Failed to load dynamic areas:", error);
    return [...visibleAreaSlugs, "other-areas"].map((area) => ({ area }));
  }
}

export async function buildAreaMetadata(areaSlug, owner = "ali", inventoryType = "ready") {
  const locale = await getRequestLocale();
  const areaName = areaNameFromSlug(areaSlug);
  const sectionLabel = inventoryType === "resale-off-plan"
    ? (locale === "fa" ? "ری‌سیل آف‌پلن" : "Resale Off-Plan")
    : (locale === "fa" ? "املاک آماده" : "Ready Properties");
  const title = areaName ? `${areaName} ${sectionLabel}` : "Dubai Area Properties";
  const description = areaName
    ? `Browse curated ${sectionLabel.toLowerCase()} in ${areaName}.`
    : `Browse curated ${sectionLabel.toLowerCase()} in Dubai's prime areas.`;
  const base = inventoryType === "resale-off-plan"
    ? resaleOffPlanPathFor(owner)
    : owner === "negin"
      ? `/negin/areas/${areaSlug}`
      : `/areas/${areaSlug}`;

  return {
    title,
    description,
    alternates: { canonical: base },
    openGraph: { title, description, url: base }
  };
}

export default async function AreaInventoryPage({ params, owner = "ali", inventoryType = "ready" }) {
  const locale = await getRequestLocale();
  const config = inventoryConfig(inventoryType, locale);
  const overviewPath = owner === "negin" ? "/negin/areas" : "/areas";

  try {
    const { area } = await params;
    const areaSlug = slugifyArea(area);
    const dynamicAreaNames = await readDynamicAreaNames();
    const areaName =
      dynamicAreaNames.find((name) => slugifyArea(name) === areaSlug) ||
      areaNameFromSlug(areaSlug);
    console.log("areaSlug:", areaSlug);
    console.log("normalizedArea:", areaName);
    console.log("Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const dynamicAreaSlugs = dynamicAreaNames.map(slugifyArea);

    if (areaSlug !== "other-areas" && !dynamicAreaSlugs.includes(areaSlug)) {
      redirect(overviewPath);
    }

    if (areaSlug === "other-areas") {
      const allRows = await supabaseSelect("properties", { order: "id.asc" });
      const allProperties = filterAreaProperties((Array.isArray(allRows) ? allRows : []).map((row) => normalizeProperty({
        ...row,
        category: row?.category || row?.inventory_type || "ready",
        inventory_type: row?.inventory_type || row?.category || "Ready"
      }, row?.id)), inventoryType);
      const promotedNames = promotedAreaNames(allProperties);
      const areaProperties = allProperties.filter((property) => {
        const propertyAreaName = String(property?.area || "").trim() || "Other Areas";
        return !primaryAreaNames.has(propertyAreaName) && !promotedNames.has(propertyAreaName);
      });

      return (
        <main className="luxury-page listings-page">
          <NavBar owner={owner} locale={locale} />
          <div className="content-shell listings-page-shell">
            <section className="section listings-intro-section">
              <div className="section-header centered listings-page-header">
                <p className="section-eyebrow">{config.eyebrow}</p>
                <h1>{config.heading} Other Areas</h1>
                <p className="section-text">{config.otherAreasNote}</p>
                <a className="back-to-listings-link" href={overviewPath}>Back to all areas</a>
              </div>
            </section>
            <section className="section listing-group">
              <div className="section-header listing-group-header">
                <p className="section-eyebrow">{config.eyebrow}</p>
                <h2>{config.heading} Other Areas</h2>
              </div>
              {areaProperties.length ? (
                <AreaPropertyFilters
                  properties={areaProperties}
                  areaName="Other Areas"
                  advisorName={owner === "negin" ? "Negin Mohamadi" : "Ali Taghavi"}
                  phoneNumber={owner === "negin" ? "971505996547" : "971522950316"}
                  owner={owner}
                  sourcePage={`${owner === "negin" ? "Negin" : "Ali"} ${config.eyebrow} Area Page: Other Areas`}
                  redirectBase={overviewPath}
                  redirectBaseByCategory={{
                    all: owner === "negin" ? "/negin/listings" : "/listings",
                    ready: owner === "negin" ? `/negin/areas/${areaSlug}` : `/areas/${areaSlug}`,
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
                  <h3>{locale === "fa" ? "هنوز لیستینگی در این مناطق موجود نیست." : "No listings available in this area yet."}</h3>
                  <p>{config.emptyBody}</p>
                </article>
              )}
            </section>
          </div>
        </main>
      );
    }

    const { data, error } = await fetchPropertiesByAreaName(areaName);
    console.log("data:", data);
    console.log("error:", error);
    if (error) {
      console.error(`[public-area:${areaSlug}] Supabase error:`, error);
    }

    const normalizedRows = (Array.isArray(data) ? data : []).map((row) =>
      normalizeProperty(
        {
          ...row,
          category: row?.category || row?.inventory_type || "ready",
          inventory_type: row?.inventory_type || row?.category || "Ready"
        },
        row?.id
      )
    );
    const areaProperties = filterAreaProperties(normalizedRows, inventoryType);
    console.log("fetched listings count:", areaProperties.length);

    return (
      <main className="luxury-page listings-page">
        <NavBar owner={owner} locale={locale} />
        <div className="content-shell listings-page-shell">
          <section className="section listings-intro-section">
            <div className="section-header centered listings-page-header">
              <p className="section-eyebrow">{config.eyebrow}</p>
              <h1>{config.heading} {areaName}</h1>
              <p className="section-text">{`Curated opportunities in ${areaName}.`}</p>
              <a className="back-to-listings-link" href={overviewPath}>Back to all areas</a>
            </div>
          </section>

          <section className="section listing-group">
            <div className="section-header listing-group-header">
              <p className="section-eyebrow">{config.eyebrow}</p>
              <h2>{config.heading} {areaName}</h2>
            </div>
            {areaProperties.length ? (
              <AreaPropertyFilters
                properties={areaProperties}
                areaName={areaName}
                advisorName={owner === "negin" ? "Negin Mohamadi" : "Ali Taghavi"}
                phoneNumber={owner === "negin" ? "971505996547" : "971522950316"}
                owner={owner}
                sourcePage={`${owner === "negin" ? "Negin" : "Ali"} ${config.eyebrow} Area Page: ${areaName}`}
                redirectBase={overviewPath}
                redirectBaseByCategory={{
                  all: owner === "negin" ? "/negin/listings" : "/listings",
                  ready: owner === "negin" ? `/negin/areas/${areaSlug}` : `/areas/${areaSlug}`,
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
                <h3>{locale === "fa" ? `هنوز لیستینگی در ${areaName} موجود نیست.` : "No listings available in this area yet."}</h3>
                <p>{config.emptyBody}</p>
              </article>
            )}
          </section>
        </div>
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
