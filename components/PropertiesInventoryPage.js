import AreaPropertyFilters from "./AreaPropertyFilters";
import ResponsiveNavbar from "./ResponsiveNavbar";
import {
  isReadyProperty,
  isPubliclyVisibleProperty,
  normalizeAreaSlug,
  isResaleOffPlanProperty,
  readProperties
} from "../lib/properties.js";
import { projectToProperty, readProjects } from "../lib/projects.js";
import {
  offPlanProjectsPathFor,
  readyPropertiesPathFor,
  resaleOffPlanPathFor
} from "../lib/public-context.js";
import { getImageSrc } from "../lib/get-image-src.js";
import { localizePath } from "../lib/locale";
import { getRequestLocale } from "../lib/server-locale";

const visibleAreaSlugs = ["palm-jumeirah", "downtown", "bluewaters", "meydan"];
const primaryAreaOrder = ["Palm Jumeirah", "Downtown", "Bluewaters", "Meydan"];
const primaryAreaNames = new Set(primaryAreaOrder);
const searchKeys = ["q", "category", "bedrooms", "property_type", "min_price", "max_price", "handover"];
const promotionThreshold = 4;
const primaryAreaFallbacks = {
  "palm-jumeirah": {
    name: "Palm Jumeirah",
    note: "Curated ready properties in Dubai's signature waterfront address."
  },
  downtown: {
    name: "Downtown",
    note: "Curated ready properties in Dubai's flagship central district."
  },
  bluewaters: {
    name: "Bluewaters",
    note: "Curated ready properties in one of Dubai's most distinctive waterfront island addresses."
  },
  meydan: {
    name: "Meydan",
    note: "Curated ready properties in a strategic luxury growth district."
  }
};

function slugifyArea(value) {
  return String(value || "area")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function groupByArea(properties) {
  const groups = new Map();

  properties.forEach((property) => {
    const area = String(property.area || "").trim() || "Other Areas";
    const areaSlug = normalizeAreaSlug(area) || "other-areas";
    if (!groups.has(areaSlug)) groups.set(areaSlug, { name: area, items: [] });
    groups.get(areaSlug).items.push(property);
  });

  return groups;
}

function areaMetaFor(name, fallbackItems = [], fallbackNote = "") {
  const slug = slugifyArea(name);
  const fallback = primaryAreaFallbacks[slug];
  const derivedName = fallback?.name || name;

  return {
    slug,
    name: derivedName,
    note: fallback?.note || fallbackNote || `Curated opportunities in ${derivedName}.`,
    image_url: "",
    imageClass: "project-three",
    items: fallbackItems
  };
}

function inventoryConfig(inventoryType) {
  if (inventoryType === "all") {
    return {
      eyebrow: "Global Property Search",
      title: "Search Dubai Properties Across Categories",
      subtitle: "Move smoothly between ready properties, off-plan projects, and resale off-plan opportunities from one shared search experience.",
      intro: "Search across ready, off-plan, and resale off-plan inventory by area, building, property type, bedrooms, and budget.",
      cardDescription: "Curated opportunities across additional Dubai locations.",
      cardButton: "View Properties",
      category: "all"
    };
  }

  if (inventoryType === "resale-off-plan") {
    return {
      eyebrow: "Resale Off-Plan",
      title: "Explore Resale Off-Plan by Area",
      subtitle: "Browse curated resale off-plan opportunities across Dubai's most sought-after areas and branded addresses.",
      intro: "Search resale off-plan opportunities by area, building, property type, bedrooms, and budget.",
      cardDescription: "Curated resale off-plan opportunities across additional Dubai locations.",
      cardButton: "View Properties",
      category: "resale-off-plan"
    };
  }

  return {
    eyebrow: "Shared Ready Properties",
    title: "Explore Properties by Area",
    subtitle: "Browse curated opportunities organized by Dubai's most sought-after locations and branded addresses.",
    intro: "Search ready properties by area, building, property type, bedrooms, and budget.",
    cardDescription: "Curated ready properties across additional Dubai locations.",
    cardButton: "View Properties",
    category: "ready"
  };
}

function inventoryCopy(locale = "en", inventoryType = "ready") {
  const isFa = locale === "fa";

  if (inventoryType === "all") {
    return {
      eyebrow: isFa ? "جستجوی سراسری ملک" : "Global Property Search",
      title: isFa ? "جستجوی ملک در تمام دسته‌بندی‌های دبی" : "Search Dubai Properties Across Categories",
      subtitle: isFa
        ? "میان املاک آماده، پروژه‌های آف‌پلن و فرصت‌های ری‌سیل آف‌پلن در یک تجربه جست‌وجوی یکپارچه جابه‌جا شوید."
        : "Move smoothly between ready properties, off-plan projects, and resale off-plan opportunities from one shared search experience.",
      intro: isFa
        ? "در میان املاک آماده، آف‌پلن و ری‌سیل آف‌پلن بر اساس منطقه، ساختمان، نوع ملک، تعداد خواب و بودجه جست‌وجو کنید."
        : "Search across ready, off-plan, and resale off-plan inventory by area, building, property type, bedrooms, and budget.",
      cardDescription: isFa ? "فرصت‌های منتخب در سایر مناطق دبی." : "Curated opportunities across additional Dubai locations.",
      cardButton: isFa ? "مشاهده املاک" : "View Properties",
      category: "all"
    };
  }

  if (inventoryType === "resale-off-plan") {
    return {
      eyebrow: isFa ? "ری‌سیل آف‌پلن" : "Resale Off-Plan",
      title: isFa ? "جست‌وجوی ری‌سیل آف‌پلن بر اساس منطقه" : "Explore Resale Off-Plan by Area",
      subtitle: isFa
        ? "فرصت‌های منتخب ری‌سیل آف‌پلن را در مناطق و آدرس‌های شاخص دبی مرور کنید."
        : "Browse curated resale off-plan opportunities across Dubai's most sought-after areas and branded addresses.",
      intro: isFa
        ? "فرصت‌های ری‌سیل آف‌پلن را بر اساس منطقه، ساختمان، نوع ملک، تعداد خواب و بودجه جست‌وجو کنید."
        : "Search resale off-plan opportunities by area, building, property type, bedrooms, and budget.",
      cardDescription: isFa ? "فرصت‌های منتخب ری‌سیل آف‌پلن در سایر مناطق دبی." : "Curated resale off-plan opportunities across additional Dubai locations.",
      cardButton: isFa ? "مشاهده املاک" : "View Properties",
      category: "resale-off-plan"
    };
  }

  return {
    eyebrow: isFa ? "املاک آماده" : "Shared Ready Properties",
    title: isFa ? "جست‌وجوی املاک بر اساس منطقه" : "Explore Properties by Area",
    subtitle: isFa
      ? "فرصت‌های منتخب را بر اساس مهم‌ترین مناطق و آدرس‌های برندد دبی مرور کنید."
      : "Browse curated opportunities organized by Dubai's most sought-after locations and branded addresses.",
    intro: isFa
      ? "املاک آماده را بر اساس منطقه، ساختمان، نوع ملک، تعداد خواب و بودجه جست‌وجو کنید."
      : "Search ready properties by area, building, property type, bedrooms, and budget.",
    cardDescription: isFa ? "املاک آماده منتخب در سایر مناطق دبی." : "Curated ready properties across additional Dubai locations.",
    cardButton: isFa ? "مشاهده املاک" : "View Properties",
    category: "ready"
  };
}

function NavBar({ owner = "ali", locale = "en" }) {
  const homeHref = localizePath(owner === "negin" ? "/negin" : "/", locale);
  const readyHref = localizePath(readyPropertiesPathFor(owner), locale);
  const offPlanHref = localizePath(offPlanProjectsPathFor(owner), locale);
  const resaleHref = localizePath(resaleOffPlanPathFor(owner), locale);
  const areasHref = `${homeHref}#areas`;
  const contactHref = `${homeHref}#contact`;
  const aboutHref = `${homeHref}#advisory`;
  const switchHref = localizePath(owner === "ali" ? "/negin" : "/", locale);
  const copy = locale === "fa"
    ? {
        brand: "املاک لوکس دبی",
        ready: "املاک آماده",
        offPlan: "پروژه‌های آف‌پلن",
        resale: "ری‌سیل آف‌پلن",
        areas: "مناطق برتر",
        contact: "ارتباط",
        about: "درباره من",
        otherAdvisor: owner === "ali" ? "نگین محمدی" : "علی تقوی"
      }
    : {
        brand: "Dubai Luxury Properties",
        ready: "Ready Properties",
        offPlan: "Off-Plan Projects",
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
        { href: offPlanHref, label: copy.offPlan },
        { href: resaleHref, label: copy.resale },
        { href: areasHref, label: copy.areas },
        { href: switchHref, label: copy.otherAdvisor },
        { href: contactHref, label: copy.contact },
        { href: aboutHref, label: copy.about }
      ]}
      locale={locale}
    />
  );
}

function filterPropertiesByInventory(properties, inventoryType) {
  const visibleProperties = properties.filter(isPubliclyVisibleProperty);
  if (inventoryType === "all") return visibleProperties;
  if (inventoryType === "resale-off-plan") return visibleProperties.filter(isResaleOffPlanProperty);
  return visibleProperties.filter(isReadyProperty);
}

export default async function PropertiesInventoryPage({ searchParams, owner = "ali", inventoryType = "ready" }) {
  const locale = await getRequestLocale();
  const params = await searchParams;
  const hasSearch = searchKeys.some((key) => params?.[key]);
  const config = inventoryCopy(locale, inventoryType);
  let baseProperties = [];
  let propertySource = "supabase";

  try {
    baseProperties = await readProperties({
      allowFallback: false,
      inventoryType: inventoryType === "all" ? "all" : inventoryType
    });
  } catch (error) {
    console.warn(`[public-properties:${inventoryType}] Supabase unavailable, falling back to local JSON:`, error.message || error);
    baseProperties = await readProperties({
      allowFallback: true,
      inventoryType: inventoryType === "all" ? "all" : inventoryType
    });
    propertySource = "local-fallback";
  }

  const projectProperties = (await readProjects()).map(projectToProperty);
  const searchableInventory = [...baseProperties, ...projectProperties];
  const properties = filterPropertiesByInventory(baseProperties, inventoryType);
  const propertiesByArea = groupByArea(properties);
  const areaBasePath = inventoryType === "resale-off-plan"
    ? `${owner === "negin" ? "/negin" : ""}/resale-off-plan`
    : `${owner === "negin" ? "/negin/areas" : "/areas"}`;
  const overviewBasePath = inventoryType === "resale-off-plan"
    ? resaleOffPlanPathFor(owner)
    : readyPropertiesPathFor(owner);

  const defaultGroups = visibleAreaSlugs
    .map((slug) => {
      const fallbackName = primaryAreaFallbacks[slug]?.name || slug;
      const items = properties.filter((property) => normalizeAreaSlug(property?.area) === slug);
      return {
        slug,
        name: fallbackName,
        note: primaryAreaFallbacks[slug]?.note || `Curated opportunities in ${fallbackName}.`,
        items
      };
    })
    .filter((group) => group.items.length > 0);
  const promotedGroups = [...propertiesByArea.entries()]
    .filter(([, group]) => !primaryAreaNames.has(group.name) && group.items.length >= promotionThreshold)
    .sort(([, leftGroup], [, rightGroup]) => leftGroup.name.localeCompare(rightGroup.name))
    .map(([, group]) => areaMetaFor(group.name, group.items));
  const promotedNames = new Set(promotedGroups.map((group) => group.name));
  const otherAreaProperties = [...propertiesByArea.entries()]
    .filter(([, group]) => !primaryAreaNames.has(group.name) && !promotedNames.has(group.name))
    .flatMap(([, group]) => group.items);
  const overviewGroups = [
    ...primaryAreaOrder
      .map((areaName) => defaultGroups.find((group) => group.name === areaName))
      .filter(Boolean),
    ...promotedGroups,
    {
      slug: "other-areas",
      name: "Other Areas",
      note: config.cardDescription,
      imageClass: "project-three",
      items: otherAreaProperties
    }
  ].filter((group) => group.items.length > 0 || group.slug === "other-areas");

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[public-properties:${inventoryType}] source=${propertySource} totalFetched=${baseProperties.length} afterInventoryFilter=${properties.length} overviewGroups=${overviewGroups.length}`
    );
    if (inventoryType === "resale-off-plan") {
      console.log("Resale off-plan listings:", properties.length);
    }
  }

  if (inventoryType === "ready" && process.env.NODE_ENV !== "production") {
    const reasonCounts = {};
    baseProperties.forEach((property) => {
      const reasons = [];
      if (!isReadyProperty(property)) reasons.push("not-ready-category");
      if (!isPubliclyVisibleProperty(property)) reasons.push(`status-excluded:${property.status || "missing"}`);
      if (!property.area) reasons.push("missing-area");
      if (!property.title) reasons.push("missing-title");
      if (!property.building) reasons.push("missing-building");

      reasons.forEach((reason) => {
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      });

      console.log(
        `[public-ready-visibility] ${property.id} :: ${reasons.length ? `excluded=${reasons.join(",")}` : "included=ready-overview"}`
      );
    });
    console.log(`[public-ready-visibility-summary] total=${baseProperties.length} included=${properties.length} excluded=${baseProperties.length - properties.length} reasons=${JSON.stringify(reasonCounts)}`);
  }

  return (
    <main className="luxury-page listings-page">
      <NavBar owner={owner} locale={locale} />

      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">{config.eyebrow}</p>
            <h1>{config.title}</h1>
            <p className="section-text">{config.subtitle}</p>
          </div>
        </section>

        <section className="section ready-search-section">
          <AreaPropertyFilters
            properties={searchableInventory}
            areaName="Dubai"
            advisorName={owner === "negin" ? "Negin Mohamadi" : "Ali Taghavi"}
            phoneNumber={owner === "negin" ? "971505996547" : "971522950316"}
            owner={owner}
            sourcePage={`${owner === "negin" ? "Negin" : "Ali"} ${config.eyebrow} Search`}
            redirectBase={overviewBasePath}
            redirectBaseByCategory={{
              all: owner === "negin" ? "/negin/listings" : "/listings",
              ready: readyPropertiesPathFor(owner),
              "off-plan": offPlanProjectsPathFor(owner),
              "resale-off-plan": resaleOffPlanPathFor(owner)
            }}
            defaultCategory={config.category}
            showResults={hasSearch}
            intro={config.intro}
            locale={locale}
          />
        </section>

        {hasSearch ? null : (
          <section className="section listings-area-section">
            <div className="three-column-grid listings-area-grid">
              {overviewGroups.map((group) => (
                <a className="listing-card area-overview-card" href={`${areaBasePath}/${group.slug}`} key={group.slug}>
                  <div
                    className={`listing-image area-overview-image ${group.imageClass || ""}`}
                    style={getImageSrc(group, "") ? { backgroundImage: `url("${getImageSrc(group, "")}")` } : undefined}
                  ></div>
                  <div className="listing-content">
                    <span className="listing-label">{locale === "fa" ? `${group.items.length} فرصت` : `${group.items.length} Opportunities`}</span>
                    <span className="listing-badge">{locale === "fa" ? "منطقه / ناحیه" : "Area / District"}</span>
                    <h3>{group.name}</h3>
                    <p className="listing-description">{group.note}</p>
                    <span className="button secondary-button area-overview-button">{config.cardButton}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
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
}
