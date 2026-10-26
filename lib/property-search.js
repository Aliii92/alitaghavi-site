// Property records usually use English area names, while many buyers search in Persian.
// Keep these aliases explicit so matching stays predictable and doesn't depend on AI.
const AREA_ALIASES = [
  { key: "downtown", names: ["downtown", "downtown dubai", "داون تاون", "داونتاون", "مرکز دبی"] },
  { key: "palm jumeirah", names: ["palm jumeirah", "the palm", "پالم جمیرا", "پالم جمیراه", "نخل جمیرا"] },
  { key: "dubai marina", names: ["dubai marina", "marina", "دبی مارینا", "مارینا"] },
  { key: "business bay", names: ["business bay", "بیزینس بی", "بیزنس بی"] },
  { key: "mudon", names: ["mudon", "مدون", "مودون"] },
  { key: "the valley", names: ["the valley", "valley", "د ولی", "دوالی", "ولی دبی", "د ولی دبی"] },
  { key: "zabeel", names: ["zabeel", "zaabeel", "زعبیل", "زبیل"] },
  { key: "bluewaters", names: ["bluewaters", "bluewaters island", "بلوواترز", "بلو واترز"] },
  { key: "creek harbour", names: ["creek harbour", "dubai creek harbour", "کریک هاربر", "دبی کریک هاربر"] },
  { key: "jbr", names: ["jbr", "جميرا بيتش رزيدنس", "جمیرا بیچ رزیدنس"] },
  { key: "dubai hills", names: ["dubai hills", "dubai hills estate", "دبی هیلز"] },
  { key: "meydan", names: ["meydan", "میدان"] }
];

export function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/[\u200c\u200d\u200e\u200f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_ALIASES = AREA_ALIASES.map(({ key, names }) => ({
  key,
  names: names.map(normalizeSearchText)
}));

export function canonicalPropertyArea(value) {
  const normalized = normalizeSearchText(value);
  return NORMALIZED_ALIASES.find(({ names }) => names.includes(normalized))?.key || normalized;
}

export function matchesPropertyArea(propertyArea, requestedArea) {
  if (!requestedArea || requestedArea === "all") return true;
  return canonicalPropertyArea(propertyArea) === canonicalPropertyArea(requestedArea);
}

export function matchesPropertyQuery(property, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchableText = normalizeSearchText([
    property.area,
    property.building,
    property.title,
    property.size,
    property.view,
    property.short_description,
    property.property_type,
    property.handoverDate,
    property.handover_date
  ].filter(Boolean).join(" "));

  if (searchableText.includes(normalizedQuery)) return true;
  // Exact area aliases allow Persian input to find English records. Longer
  // building/keyword searches still use literal matching to avoid false hits.
  const matchingArea = NORMALIZED_ALIASES.find(({ names }) => names.includes(normalizedQuery));
  return Boolean(matchingArea && matchesPropertyArea(property.area, matchingArea.key));
}
