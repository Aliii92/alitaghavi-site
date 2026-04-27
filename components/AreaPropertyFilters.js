"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import AreaPropertyCard from "./AreaPropertyCard";
import BuildingGroupedListings from "./BuildingGroupedListings";
import { isPubliclyVisibleProperty } from "../lib/property-visibility.js";
import {
  offPlanProjectsPathFor,
  readyPropertiesPathFor,
  resaleOffPlanPathFor
} from "../lib/public-context.js";

const defaultWhatsAppNumber = "971522950316";

const searchCopy = {
  en: {
    search: "Search",
    clear: "Clear",
    keywordPlaceholder: "Area, building, community, or keyword",
    category: "Category",
    all: "All",
    ready: "Ready",
    offPlan: "Off-Plan",
    resaleOffPlan: "Resale Off-Plan",
    propertyType: "Property Type",
    anyType: "Any type",
    beds: "Beds",
    any: "Any",
    studio: "Studio",
    price: "Price",
    anyPrice: "Any price",
    min: "Min",
    max: "Max",
    minimum: "Minimum",
    maximum: "Maximum",
    minPrice: "Min price",
    maxPrice: "Max price",
    minPricePlaceholder: "AED min",
    maxPricePlaceholder: "AED max",
    done: "Done",
    reset: "Reset",
    handover: "Handover",
    anyHandover: "Any handover",
    propertiesFound: (count) => `${count} properties found`,
    trust: ["Curated shortlists", "Private WhatsApp follow-up", "Advisor-led guidance"],
    emptyTitle: "No properties match these filters",
    emptyBody: (areaName) =>
      `Try adjusting bedrooms, property type, budget, or ready/off-plan status to see more opportunities in ${areaName}.`,
    propertyTypes: {
      all: "Any type",
      apartment: "Apartment",
      villa: "Villa",
      townhouse: "Townhouse",
      penthouse: "Penthouse",
      office: "Office",
      land: "Land"
    }
  },
  fa: {
    search: "جستجو",
    clear: "پاک کردن",
    keywordPlaceholder: "منطقه، ساختمان، محله یا کلمه کلیدی",
    category: "دسته‌بندی",
    all: "همه",
    ready: "آماده",
    offPlan: "در حال ساخت",
    resaleOffPlan: "ری‌سیل آف‌پلن",
    propertyType: "نوع ملک",
    anyType: "همه نوع",
    beds: "تعداد خواب",
    any: "همه",
    studio: "استودیو",
    price: "قیمت",
    anyPrice: "هر قیمت",
    min: "حداقل",
    max: "حداکثر",
    minimum: "حداقل",
    maximum: "حداکثر",
    minPrice: "حداقل قیمت",
    maxPrice: "حداکثر قیمت",
    minPricePlaceholder: "حداقل قیمت",
    maxPricePlaceholder: "حداکثر قیمت",
    done: "تایید",
    reset: "بازنشانی",
    handover: "زمان تحویل",
    anyHandover: "هر زمان تحویل",
    propertiesFound: (count) => `${count} ملک یافت شد`,
    trust: ["گزینه‌های منتخب", "پیگیری خصوصی در واتساپ", "راهنمایی مشاوره‌ای"],
    emptyTitle: "ملکی با این فیلترها پیدا نشد",
    emptyBody: (areaName) =>
      `برای دیدن فرصت‌های بیشتر در ${areaName}، تعداد خواب، نوع ملک، بودجه یا وضعیت آماده/آف‌پلن را تغییر دهید.`,
    propertyTypes: {
      all: "همه نوع",
      apartment: "آپارتمان",
      villa: "ویلا",
      townhouse: "تاون‌هاوس",
      penthouse: "پنت‌هاوس",
      office: "دفتر",
      land: "زمین"
    }
  }
};

const bedroomOptionValues = [
  { value: "all", labelKey: "any" },
  { value: "studio", labelKey: "studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8-plus", label: "8+" }
];

const propertyTypeOptionValues = [
  { value: "all" },
  { value: "apartment" },
  { value: "villa" },
  { value: "townhouse" },
  { value: "penthouse" },
  { value: "office" },
  { value: "land" }
];

const statusOptionValues = [
  { value: "all", labelKey: "all" },
  { value: "ready", labelKey: "ready" },
  { value: "off-plan", labelKey: "offPlan" },
  { value: "resale-off-plan", labelKey: "resaleOffPlan" }
];

const handoverOptionValues = [
  { value: "all", labelKey: "anyHandover" },
  { value: "2025", label: "2025" },
  { value: "2026", label: "2026" },
  { value: "2027", label: "2027" },
  { value: "2028-plus", label: "2028+" }
];

function localizeOptions(options, t, propertyType = false) {
  return options.map((option) => ({
    ...option,
    label: propertyType ? t.propertyTypes[option.value] : option.label || t[option.labelKey]
  }));
}

function parsePrice(value) {
  const raw = String(value || "").toLowerCase().replace(/,/g, "").replace(/aed|درهم/g, "");
  const match = raw.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (raw.includes("m")) return amount * 1000000;
  return amount;
}

function parseBedroomCount(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes("studio")) return 0;
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function normalizePropertyType(value) {
  const raw = String(value || "").toLowerCase();
  if (raw.includes("penthouse")) return "penthouse";
  if (raw.includes("townhouse")) return "townhouse";
  if (raw.includes("villa")) return "villa";
  if (raw.includes("office")) return "office";
  if (raw.includes("land") || raw.includes("plot")) return "land";
  if (raw.includes("apartment") || raw.includes("residence") || raw.includes("bedroom")) return "apartment";
  return raw || "apartment";
}

function extractHandoverYear(property) {
  const source = [
    property.handoverDate,
    property.handover_date,
    property.handover,
    property.notes,
    property.short_description
  ]
    .filter(Boolean)
    .join(" ");
  const match = String(source).match(/20\d{2}/);
  return match ? Number(match[0]) : null;
}

function FilterDropdown({ id, label, value, options, onChange, activeDropdown, setActiveDropdown }) {
  const dropdownRef = useRef(null);
  const open = activeDropdown === id;
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown((current) => (current === id ? "" : current));
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, setActiveDropdown]);

  return (
    <div className="area-filter-dropdown bayut-filter-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="area-filter-trigger"
        onClick={(event) => {
          event.stopPropagation();
          setActiveDropdown((current) => (current === id ? "" : id));
        }}
      >
        <span>{label}</span>
        {selected.label}
      </button>
      {open ? (
        <div className="area-filter-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`area-filter-option ${option.value === value ? "active" : ""}`}
              onClick={() => {
                onChange(option.value);
                setActiveDropdown("");
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PriceDropdown({ minPrice, maxPrice, onMinChange, onMaxChange, activeDropdown, setActiveDropdown, t }) {
  const dropdownRef = useRef(null);
  const open = activeDropdown === "price";
  const label = minPrice || maxPrice ? `${minPrice || t.min} - ${maxPrice || t.max}` : t.anyPrice;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown((current) => (current === "price" ? "" : current));
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setActiveDropdown]);

  return (
    <div className="area-filter-dropdown bayut-filter-dropdown price-filter-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="area-filter-trigger"
        onClick={(event) => {
          event.stopPropagation();
          setActiveDropdown((current) => (current === "price" ? "" : "price"));
        }}
      >
        <span>{t.price}</span>
        {label}
      </button>
      {open ? (
        <div className="area-filter-menu price-filter-menu" onClick={(event) => event.stopPropagation()}>
          <div className="price-popup-grid">
            <label>
              <span>{t.minimum}</span>
              <input inputMode="numeric" value={minPrice} onChange={(event) => onMinChange(event.target.value)} placeholder={t.minPricePlaceholder} />
            </label>
            <label>
              <span>{t.maximum}</span>
              <input inputMode="numeric" value={maxPrice} onChange={(event) => onMaxChange(event.target.value)} placeholder={t.maxPricePlaceholder} />
            </label>
          </div>
          <div className="price-popup-actions">
            <button type="button" className="area-filter-option" onClick={() => { onMinChange(""); onMaxChange(""); }}>
              {t.reset}
            </button>
            <button type="button" className="button primary-button price-done-button" onClick={() => setActiveDropdown("")}>
              {t.done}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AreaPropertyFilters({
  properties = [],
  areaName = "Dubai",
  mode = "results",
  intro = "Search across curated ready and off-plan opportunities.",
  advisorName = "Ali Taghavi",
  phoneNumber = defaultWhatsAppNumber,
  owner = "ali",
  sourcePage = "",
  redirectBase = "/listings",
  redirectBaseByCategory,
  groupByBuilding = false,
  initialVisiblePerGroup = 3,
  defaultCategory = "all",
  hideCategory = false,
  showResults = true,
  locale = "en"
}) {
  const pathname = usePathname();
  const isFa = locale === "fa";
  const t = searchCopy[isFa ? "fa" : "en"];
  const bedroomOptions = useMemo(() => localizeOptions(bedroomOptionValues, t), [t]);
  const propertyTypeOptions = useMemo(() => localizeOptions(propertyTypeOptionValues, t, true), [t]);
  const statusOptions = useMemo(() => localizeOptions(statusOptionValues, t), [t]);
  const handoverOptions = useMemo(() => localizeOptions(handoverOptionValues, t), [t]);
  const redirectMode = mode === "redirect";
  const [searchSubmitted, setSearchSubmitted] = useState(showResults);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [bedrooms, setBedrooms] = useState("all");
  const [category, setCategory] = useState(defaultCategory);
  const [propertyType, setPropertyType] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [handover, setHandover] = useState("all");
  const [activeDropdown, setActiveDropdown] = useState("");
  const shouldShowResults = showResults || searchSubmitted;
  const routeMap = useMemo(
    () => ({
      all: owner === "negin" ? "/negin/listings" : "/listings",
      ready: readyPropertiesPathFor(owner),
      "off-plan": offPlanProjectsPathFor(owner),
      "resale-off-plan": resaleOffPlanPathFor(owner),
      ...(redirectBaseByCategory || {})
    }),
    [owner, redirectBaseByCategory]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get("q") || "";

    setSearchInput(nextQuery);
    setQuery(nextQuery);
    setBedrooms(params.get("bedrooms") || "all");
    setCategory(params.get("category") || defaultCategory);
    setPropertyType(params.get("property_type") || "all");
    setMinPrice(params.get("min_price") || "");
    setMaxPrice(params.get("max_price") || "");
    setHandover(params.get("handover") || "all");
  }, [defaultCategory]);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const minBudget = minPrice ? parsePrice(minPrice) : 0;
    const maxBudget = maxPrice ? parsePrice(maxPrice) : Infinity;

    return properties.filter((property) => {
      if (!isPubliclyVisibleProperty(property)) {
        return false;
      }

      const propertyPrice = parsePrice(property.price);
      const bedroomCount = parseBedroomCount(property.bedrooms || property.title);
      const matchesBedrooms =
        bedrooms === "all" ||
        (bedrooms === "studio"
          ? bedroomCount === 0
          : bedrooms === "8-plus"
            ? bedroomCount >= 8
            : bedroomCount === Number(bedrooms));
      const matchesCategory = category === "all" || property.category === category;
      const matchesPropertyType = propertyType === "all" || normalizePropertyType(property.property_type || property.title) === propertyType;
      const matchesPrice = (!minPrice || propertyPrice >= minBudget) && (!maxPrice || propertyPrice <= maxBudget);
      const handoverYear = extractHandoverYear(property);
      const matchesHandover =
        !["off-plan", "resale-off-plan"].includes(category) ||
        handover === "all" ||
        (handover === "2028-plus" ? handoverYear >= 2028 : handoverYear === Number(handover));
      const searchableText = [
        property.area,
        property.building,
        property.title,
        property.size,
        property.view,
        property.short_description,
        property.notes,
        property.property_type,
        property.handoverDate,
        property.handover_date
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      return matchesBedrooms && matchesCategory && matchesPropertyType && matchesPrice && matchesHandover && matchesQuery;
    });
  }, [bedrooms, category, handover, maxPrice, minPrice, properties, propertyType, query]);

  function buildListingsUrl(overrides = {}) {
    const nextSearchInput = overrides.searchInput ?? searchInput;
    const nextCategory = overrides.category ?? category;
    const nextBedrooms = overrides.bedrooms ?? bedrooms;
    const nextPropertyType = overrides.propertyType ?? propertyType;
    const nextMinPrice = overrides.minPrice ?? minPrice;
    const nextMaxPrice = overrides.maxPrice ?? maxPrice;
    const nextHandover = overrides.handover ?? handover;
    const targetBase = routeMap[nextCategory] || redirectBase;
    const params = new URLSearchParams();
    if (nextSearchInput.trim()) params.set("q", nextSearchInput.trim());
    if (nextCategory !== defaultCategory || nextCategory === "all") params.set("category", nextCategory);
    if (nextBedrooms !== "all") params.set("bedrooms", nextBedrooms);
    if (nextPropertyType !== "all") params.set("property_type", nextPropertyType);
    if (nextMinPrice) params.set("min_price", nextMinPrice);
    if (nextMaxPrice) params.set("max_price", nextMaxPrice);
    if (["off-plan", "resale-off-plan"].includes(nextCategory) && nextHandover !== "all") params.set("handover", nextHandover);
    const queryString = params.toString();
    return `${targetBase}${queryString ? `?${queryString}` : ""}`;
  }

  function navigateTo(url) {
    window.location.href = url;
  }

  function applySearch(event) {
    event.preventDefault();
    const url = buildListingsUrl();
    if (redirectMode || url !== `${pathname}${window.location.search}`) {
      navigateTo(url);
      return;
    }
    setQuery(searchInput);
    setSearchSubmitted(true);
  }

  function clearFilters() {
    setSearchInput("");
    setQuery("");
    setBedrooms("all");
    setCategory(defaultCategory);
    setPropertyType("all");
    setMinPrice("");
    setMaxPrice("");
    setHandover("all");
    setSearchSubmitted(showResults);

    const clearBase = routeMap[defaultCategory] || redirectBase;
    const currentSearch = window.location.search;
    const shouldNavigate =
      pathname !== clearBase ||
      currentSearch ||
      category !== defaultCategory ||
      bedrooms !== "all" ||
      propertyType !== "all" ||
      minPrice ||
      maxPrice ||
      handover !== "all";

    if (shouldNavigate && !(pathname === "/" && defaultCategory === "all")) {
      navigateTo(clearBase);
    }
  }

  function handleCategoryChange(value) {
    const nextHandover = ["off-plan", "resale-off-plan"].includes(value) ? handover : "all";
    setCategory(value);
    if (!["off-plan", "resale-off-plan"].includes(value)) setHandover("all");

    const nextUrl = buildListingsUrl({ category: value, handover: nextHandover });
    if (nextUrl !== `${pathname}${window.location.search}`) {
      navigateTo(nextUrl);
    }
  }

  return (
    <>
      <form className={`property-search-panel ${isFa ? "rtl" : ""}`} dir={isFa ? "rtl" : "ltr"} onSubmit={applySearch}>
        <label className="property-search-field property-search-keyword bayut-search-input">
          <div className="property-search-input-shell">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                if (!redirectMode) setQuery(event.target.value);
              }}
              placeholder={t.keywordPlaceholder}
            />
          </div>
        </label>

        {!hideCategory ? (
          <FilterDropdown id="category" label={t.category} value={category} options={statusOptions} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} onChange={handleCategoryChange} />
        ) : null}
        <FilterDropdown id="property-type" label={t.propertyType} value={propertyType} options={propertyTypeOptions} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} onChange={setPropertyType} />
        <FilterDropdown id="beds" label={t.beds} value={bedrooms} options={bedroomOptions} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} onChange={setBedrooms} />
        <PriceDropdown minPrice={minPrice} maxPrice={maxPrice} onMinChange={setMinPrice} onMaxChange={setMaxPrice} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} t={t} />
        {["off-plan", "resale-off-plan"].includes(category) ? (
          <FilterDropdown id="handover" label={t.handover} value={handover} options={handoverOptions} activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown} onChange={setHandover} />
        ) : null}

        <button className="button primary-button property-search-button" type="submit">
          {t.search}
        </button>
        <button className="property-search-clear-inline" type="button" onClick={clearFilters}>
          {t.clear}
        </button>
      </form>

      <div className="property-search-meta">
        <span>{redirectMode || !shouldShowResults ? intro : t.propertiesFound(filteredProperties.length)}</span>
      </div>

      {!redirectMode && shouldShowResults && (
        filteredProperties.length ? (
          groupByBuilding ? (
            <BuildingGroupedListings
              properties={filteredProperties}
              areaName={areaName}
              advisorName={advisorName}
              sourcePage={sourcePage}
              phoneNumber={phoneNumber}
              owner={owner}
              initialVisiblePerGroup={initialVisiblePerGroup}
              locale={locale}
            />
          ) : (
          <div className="three-column-grid all-listings-grid">
            {filteredProperties.map((property) => (
              <AreaPropertyCard
                key={property.id}
                property={property}
                areaName={areaName}
                advisorName={advisorName}
                sourcePage={sourcePage}
                phoneNumber={phoneNumber}
                owner={owner}
                locale={locale}
              />
            ))}
          </div>
          )
        ) : (
          <article className="contact-card empty-listings-card">
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyBody(areaName)}</p>
          </article>
        )
      )}
    </>
  );
}
