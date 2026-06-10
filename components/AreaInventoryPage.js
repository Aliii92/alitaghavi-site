import { redirect } from "next/navigation";
import AreaPropertyFilters from "./AreaPropertyFilters";
import ResponsiveNavbar from "./ResponsiveNavbar";
import {
  isReadyProperty,
  isResaleOffPlanProperty,
  isPubliclyVisibleProperty,
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
import { areaNameFromSlug, readDynamicAreaNames } from "../lib/dynamic-areas.js";

const visibleAreaSlugs = ["palm-jumeirah", "downtown", "bluewaters", "meydan"];
const primaryAreaNames = new Set(["Palm Jumeirah", "Downtown", "Bluewaters", "Meydan"]);
const promotionThreshold = 4;
const resaleAreaFields = ["area", "region", "location", "community", "project_location", "building", "project_name", "project"];

function slugifyArea(value) {
  return String(value || "area")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeAreaValue(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[_-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
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
  const homeHref = localizePath("/", locale);
  const readyHref = localizePath(readyPropertiesPathFor(owner), locale);
  const offPlanHref = localizePath(offPlanProjectsPathFor(owner), locale);
  const resaleHref = localizePath(resaleOffPlanPathFor(owner), locale);
  const blogHref = localizePath("/blog", locale);
  const copy = locale === "fa"
    ? {
        brand: "املاک لوکس دبی",
        ready: "املاک آماده",
        projects: "پروژه‌های آف‌پلن",
        resale: "ری‌سیل آف‌پلن",
        areas: "مناطق برتر",
        contact: "ارتباط",
        about: "درباره من"
      }
    : {
        brand: "Dubai Luxury Properties",
        ready: "Ready Properties",
        projects: "Off-Plan Projects",
        resale: "Resale Off-Plan",
        areas: "Prime Areas",
        contact: "Contact",
        about: "About Me"
      };

  return (
    <ResponsiveNavbar
      brandLabel={copy.brand}
      brandHref={homeHref}
        links={[
          { href: readyHref, label: copy.ready },
          { href: offPlanHref, label: copy.projects },
          { href: resaleHref, label: copy.resale },
          { href: blogHref, label: locale === "fa" ? "تحلیل بازار" : "Market Insights" },
          { href: "/areas", label: copy.areas },
          { href: `${homeHref}#contact`, label: copy.contact },
          { href: `${homeHref}#advisory`, label: copy.about }
        ]}
      locale={locale}
    />
  );
}

function DebugPanel({ debug }) {
  if (process.env.NODE_ENV === "production" || !debug) return null;

  return (
    <div className="contact-card empty-listings-card" style={{ marginTop: "1.5rem", textAlign: "left" }}>
      <h3>Area Debug</h3>
      <p><strong>areaSlug:</strong> {debug.areaSlug || "(missing)"}</p>
      <p><strong>Supabase URL exists:</strong> {String(Boolean(debug.supabaseUrlExists))}</p>
      <p><strong>Supabase key exists:</strong> {String(Boolean(debug.supabaseKeyExists))}</p>
      <p><strong>Supabase table:</strong> {debug.table || "(missing)"}</p>
      <p><strong>Supabase error:</strong> {debug.supabaseError || "(none)"}</p>
      <p><strong>Fetched properties count:</strong> {String(debug.fetchedPropertiesCount ?? 0)}</p>
      <p><strong>Matched listings count:</strong> {String(debug.matchedListingsCount ?? 0)}</p>
    </div>
  );
}

function SafeAreaPage({ owner = "ali", locale = "en", config, title, message, overviewPath, debug = null }) {
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
            <DebugPanel debug={debug} />
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

function tableNameForInventoryType(inventoryType) {
  return inventoryType === "resale-off-plan" ? "resale_off_plan" : "properties";
}

function propertyMatchesArea(property, areaSlug, inventoryType) {
  const target = normalizeAreaValue(areaSlug);
  if (!target) return false;

  if (inventoryType === "resale-off-plan") {
    return resaleAreaFields.some((field) => {
      const candidate = normalizeAreaValue(property?.[field]);
      return candidate === target || candidate.includes(target) || target.includes(candidate);
    });
  }

  const candidate = normalizeAreaValue(property?.area);
  return candidate === target || candidate.includes(target) || target.includes(candidate);
}

function uniqueAreaDebugValues(rows, inventoryType) {
  if (inventoryType !== "resale-off-plan") {
    return [...new Set((Array.isArray(rows) ? rows : []).map((row) => String(row?.area || "").trim()).filter(Boolean))];
  }

  const values = new Set();
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    resaleAreaFields.forEach((field) => {
      const value = String(row?.[field] || "").trim();
      if (value) values.add(`${field}: ${value}`);
    });
  });
  return [...values];
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

async function fetchPropertiesByAreaSlug(areaSlug, inventoryType = "ready") {
  if (!hasSupabaseServerConfig()) return { data: null, error: new Error("Supabase server configuration is missing.") };

  try {
    const tableName = tableNameForInventoryType(inventoryType);
    const rows = await readProperties({
      allowFallback: false,
      inventoryType: inventoryType === "resale-off-plan" ? "resale-off-plan" : "ready"
    });
    const normalizedRows = Array.isArray(rows) ? rows : [];
    const areaListings = normalizedRows.filter((property) => propertyMatchesArea(property, areaSlug, inventoryType));
    return {
      data: normalizedRows,
      areaListings,
      error: null,
      tableName,
      uniqueValues: uniqueAreaDebugValues(normalizedRows, inventoryType)
    };
  } catch (error) {
    return { data: null, areaListings: [], error, tableName: tableNameForInventoryType(inventoryType), uniqueValues: [] };
  }
}

export async function buildAreaStaticParams(inventoryType = "ready") {
  try {
    const dynamicSlugs = inventoryType === "resale-off-plan"
      ? [...new Set(
          (await supabaseSelect("resale_off_plan", { order: "id.asc" }))
            .flatMap((row) => resaleAreaFields.map((field) => String(row?.[field] || "").trim()))
            .filter(Boolean)
            .map(slugifyArea)
        )]
      : (await readDynamicAreaNames()).map(slugifyArea).filter(Boolean);
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
  const base = inventoryType === "resale-off-plan" ? resaleOffPlanPathFor(owner) : `/areas/${areaSlug}`;

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
  const overviewPath = "/areas";

  try {
    const { area } = await params;
    const areaSlug = slugifyArea(area);
    const dynamicAreaNames = inventoryType === "resale-off-plan"
      ? [...new Set(
          (await supabaseSelect("resale_off_plan", { order: "id.asc" }))
            .flatMap((row) => resaleAreaFields.map((field) => String(row?.[field] || "").trim()))
            .filter(Boolean)
        )]
      : await readDynamicAreaNames();
    const areaName =
      dynamicAreaNames.find((name) => slugifyArea(name) === areaSlug) ||
      areaNameFromSlug(areaSlug);
    console.log("areaSlug:", areaSlug);
    console.log("normalizedArea:", areaName);
    console.log("Supabase URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("Supabase KEY exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const dynamicAreaSlugs = dynamicAreaNames.map(slugifyArea);
    const debugBase = {
      areaSlug,
      supabaseUrlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      table: tableNameForInventoryType(inventoryType)
    };

    if (areaSlug !== "other-areas" && !dynamicAreaSlugs.includes(areaSlug)) {
      redirect(overviewPath);
    }

    if (areaSlug === "other-areas") {
      const allRows = await readProperties({
        allowFallback: false,
        inventoryType: inventoryType === "resale-off-plan" ? "resale-off-plan" : "ready"
      });
      const allProperties = filterAreaProperties(Array.isArray(allRows) ? allRows : [], inventoryType);
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
                  advisorName="Ali Taghavi"
                  phoneNumber="971522950316"
                  owner={owner}
                  sourcePage={`Ali ${config.eyebrow} Area Page: Other Areas`}
                  redirectBase={overviewPath}
                  redirectBaseByCategory={{
                    all: "/listings",
                    ready: `/areas/${areaSlug}`,
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
              <DebugPanel
                debug={{
                  ...debugBase,
                  supabaseError: "(none)",
                  fetchedPropertiesCount: Array.isArray(allRows) ? allRows.length : 0,
                  matchedListingsCount: areaProperties.length
                }}
              />
            </section>
          </div>
        </main>
      );
    }

    const { data, areaListings, error, tableName, uniqueValues } = await fetchPropertiesByAreaSlug(areaSlug, inventoryType);
    console.log("data:", data);
    console.log("error:", error);
    console.log("table name queried:", tableName);
    console.log("total rows fetched before filtering:", Array.isArray(data) ? data.length : 0);
    console.log("unique area/location/community values found:", uniqueValues);
    console.log("rows after filtering:", Array.isArray(areaListings) ? areaListings.length : 0);
    if (error) {
      console.error(`[public-area:${areaSlug}] Supabase error:`, error);
    }

    const areaProperties = filterAreaProperties(Array.isArray(areaListings) ? areaListings : [], inventoryType);
    console.log("Fetched properties:", Array.isArray(data) ? data.length : 0);
    console.log("Matched area listings:", areaProperties.length);
    console.log("Supabase error:", error);

    if (error) {
      return (
        <SafeAreaPage
          owner={owner}
          locale={locale}
          config={config}
          title={locale === "fa" ? "لیست املاک منطقه" : "Area listings"}
          message={error.message || String(error)}
          overviewPath={overviewPath}
          debug={{
            ...debugBase,
            supabaseError: error.message || String(error),
            fetchedPropertiesCount: Array.isArray(data) ? data.length : 0,
            matchedListingsCount: areaProperties.length
          }}
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
                advisorName="Ali Taghavi"
                phoneNumber="971522950316"
                owner={owner}
                sourcePage={`Ali ${config.eyebrow} Area Page: ${areaName}`}
                redirectBase={overviewPath}
                redirectBaseByCategory={{
                  all: "/listings",
                  ready: `/areas/${areaSlug}`,
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
                <h3>{locale === "fa" ? `هنوز لیستینگی در ${areaName} موجود نیست.` : "No listings found for this area."}</h3>
                <p>{config.emptyBody}</p>
              </article>
            )}
            <DebugPanel
              debug={{
                ...debugBase,
                supabaseError: "(none)",
                fetchedPropertiesCount: Array.isArray(data) ? data.length : 0,
                matchedListingsCount: areaProperties.length
              }}
            />
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
        message={error?.message || String(error)}
        overviewPath={overviewPath}
        debug={{
          areaSlug: "(unknown)",
          supabaseUrlExists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          table: "properties",
          supabaseError: error?.message || String(error),
          fetchedPropertiesCount: 0,
          matchedListingsCount: 0
        }}
      />
    );
  }
}
