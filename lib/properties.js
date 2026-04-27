import fs from "fs/promises";
import path from "path";
import { defaultAreas, readAreas } from "./areas.js";
import { hasSupabaseServerConfig, supabaseDelete, supabaseSelect, supabaseUpsert, syncSupabaseTable } from "./supabase-server.js";

export const whatsappNumber = "971522950316";
export const propertyCategories = ["ready", "off-plan", "resale-off-plan"];

export function categoryLabelToValue(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (raw === "ready") return "ready";
  if (raw === "off-plan" || raw === "off plan" || raw === "offplan") return "off-plan";
  if (
    raw === "resale off-plan" ||
    raw === "resale off plan" ||
    raw === "resale-off-plan" ||
    raw === "resale_off_plan"
  ) {
    return "resale-off-plan";
  }

  return "";
}

export function normalizePropertyCategory(value) {
  const labeled = categoryLabelToValue(value);
  if (labeled) return labeled;

  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (raw === "offplan") return "off-plan";
  if (raw === "resale-offplan" || raw === "resale-off-plan" || raw === "resaleoffplan") {
    return "resale-off-plan";
  }

  return propertyCategories.includes(raw) ? raw : "ready";
}

export function categoryValueToLabel(value) {
  const normalized = normalizePropertyCategory(value);
  if (normalized === "off-plan") return "Off-plan";
  if (normalized === "resale-off-plan") return "Resale Off-Plan";
  return "Ready";
}

export function isReadyProperty(property) {
  return normalizePropertyCategory(property?.inventory_type || property?.category) === "ready";
}

export function isOffPlanProperty(property) {
  return normalizePropertyCategory(property?.inventory_type || property?.category) === "off-plan";
}

export function isResaleOffPlanProperty(property) {
  return normalizePropertyCategory(property?.inventory_type || property?.category) === "resale-off-plan";
}

const dataFile = path.join(process.cwd(), "data", "properties.json");
const standardTable = "properties";
const resaleTable = "resale_off_plan";

const buildingMeta = {
  "Bluewaters Residence": {
    note: "Curated resale opportunities in one of Dubai's most recognizable waterfront addresses.",
    imageClass: "featured-three"
  },
  "The Royal Atlantis": {
    note: "High-positioned residences in one of Dubai's most prestigious branded destinations.",
    imageClass: "project-two"
  },
  "Five Luxe Sensoria": {
    note: "Premium residences with Bluewaters, sea, and Marina views in a lifestyle-led setting.",
    imageClass: "area-two"
  },
  "Eden House Canal": {
    note: "A refined canal-side address for buyers seeking privacy, space, and long-term value.",
    imageClass: "project-three"
  },
  "Pearl Jumeirah": {
    note: "A rare beachfront villa setting with skyline views and ultra-private lifestyle appeal.",
    imageClass: "featured-one"
  },
  "Serenia Living": {
    note: "Palm Jumeirah off-plan opportunity with strong lifestyle and future handover appeal.",
    imageClass: "project-one"
  },
  "Beach Isle": {
    note: "Selected beachfront living with Palm views and upgraded luxury interiors.",
    imageClass: "project-two"
  },
  "Address Villas Hillcrest": {
    note: "Large-format branded villa living with family-scale space and premium community positioning.",
    imageClass: "featured-two"
  },
  "Mr. C Residences": {
    note: "A branded canal-side residence with city views and a refined serviced-living feel.",
    imageClass: "area-one"
  },
  "The Grand, Creek Harbour": {
    note: "Townhouse-style living in Creek Harbour with city and canal views.",
    imageClass: "project-three"
  },
  "Ellington Beach House": {
    note: "Curated apartments with sea, Atlantis, Burj Al Arab, and Downtown views.",
    imageClass: "featured-three"
  }
};

const fallbackImages = ["featured-one", "featured-two", "featured-three", "project-one", "project-two", "project-three"];

export const featuredAreas = defaultAreas;

export function slugify(value) {
  return String(value || "property")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeAreaSlug(value) {
  return slugify(String(value || "").trim());
}

export function matchesAreaSlug(property, areaSlug, aliases = []) {
  const targetSlug = normalizeAreaSlug(areaSlug);
  if (!targetSlug) return false;

  const candidates = [
    property?.area,
    property?.building,
    ...(Array.isArray(aliases) ? aliases : [])
  ]
    .filter(Boolean)
    .map((value) => normalizeAreaSlug(value));

  return candidates.includes(targetSlug);
}

export function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

export function isAvailableStatus(value) {
  const normalized = normalizeStatus(value);
  return !normalized || ["available", "vacant", "vacant-on-transfer", "vot", "notice-served", "rented"].includes(normalized);
}

function mapDbProperty(row) {
  return normalizeProperty(row, row.id);
}

export function propertyTableFor(property) {
  return isResaleOffPlanProperty(property) ? resaleTable : standardTable;
}

export function mapPropertyToDb(property) {
  return {
    id: property.id,
    owner: property.owner,
    title: property.title,
    area: property.area,
    building: property.building,
    category: normalizePropertyCategory(property.inventory_type || property.category),
    inventory_type: categoryValueToLabel(property.inventory_type || property.category),
    property_type: property.property_type,
    bedrooms: property.bedrooms,
    size: property.size,
    price: property.price,
    view: property.view,
    furnishing: property.furnishing,
    status: property.status,
    short_description: property.short_description,
    notes: property.notes,
    image_url: property.image_url,
    featured: Boolean(property.featured),
    whatsapp_link: property.whatsapp_link
  };
}

export async function upsertSingleProperty(property) {
  const normalized = normalizeProperty(property, property.id);

  if (!hasSupabaseServerConfig()) {
    const properties = await readLocalProperties();
    const index = properties.findIndex((item) => item.id === normalized.id);
    if (index >= 0) {
      properties[index] = normalized;
    } else {
      properties.push(normalized);
    }
    await writeLocalProperties(properties);
    return normalized;
  }

  const targetTable = propertyTableFor(normalized);
  const otherTable = targetTable === standardTable ? resaleTable : standardTable;

  await supabaseDelete(otherTable, { id: `eq.${normalized.id}` });
  await supabaseUpsert(targetTable, [mapPropertyToDb(normalized)], "id");

  const savedRows = await supabaseSelect(targetTable, { id: `eq.${normalized.id}` });
  const saved = Array.isArray(savedRows) ? savedRows[0] : null;
  if (!saved) {
    throw new Error(`Supabase verification failed: property ${normalized.id} was not found after save.`);
  }

  return mapDbProperty(saved);
}

export async function deleteSingleProperty(id, existingProperty = null) {
  if (!hasSupabaseServerConfig()) {
    const properties = await readLocalProperties();
    const nextProperties = properties.filter((property) => property.id !== id);
    await writeLocalProperties(nextProperties);
    return;
  }

  const normalized = existingProperty ? normalizeProperty(existingProperty, existingProperty.id) : null;
  const targetTable = normalized ? propertyTableFor(normalized) : null;

  if (targetTable) {
    await supabaseDelete(targetTable, { id: `eq.${id}` });
    return;
  }

  await Promise.all([
    supabaseDelete(standardTable, { id: `eq.${id}` }),
    supabaseDelete(resaleTable, { id: `eq.${id}` })
  ]);
}

async function readLocalProperties() {
  const file = await fs.readFile(dataFile, "utf8");
  return JSON.parse(file);
}

async function writeLocalProperties(properties) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, `${JSON.stringify(properties, null, 2)}\n`, "utf8");
}

export async function readProperties(options = {}) {
  const { allowFallback = true } = options;
  if (!hasSupabaseServerConfig()) {
    return readLocalProperties();
  }

  try {
    const [standardRows, resaleRows] = await Promise.all([
      supabaseSelect(standardTable, { order: "id.asc" }),
      supabaseSelect(resaleTable, { order: "id.asc" })
    ]);

    return [...(Array.isArray(standardRows) ? standardRows : []), ...(Array.isArray(resaleRows) ? resaleRows : [])].map(mapDbProperty);
  } catch (error) {
    console.error("[readProperties] Supabase fetch failed:", error);
    if (!allowFallback) {
      throw error;
    }
    console.warn("[readProperties] Falling back to local JSON:", error.message || error);
    return readLocalProperties();
  }
}

export async function writeProperties(properties) {
  if (!hasSupabaseServerConfig()) {
    await writeLocalProperties(properties);
    return;
  }

  const normalized = properties.map((property) => normalizeProperty(property, property.id));
  const standardRows = normalized
    .filter((property) => !isResaleOffPlanProperty(property))
    .map(mapPropertyToDb);
  const resaleRows = normalized
    .filter((property) => isResaleOffPlanProperty(property))
    .map(mapPropertyToDb);

  await syncSupabaseTable(standardTable, standardRows);
  await syncSupabaseTable(resaleTable, resaleRows);
}

export function normalizeProperty(input, fallbackId = "") {
  const normalizedCategory = normalizePropertyCategory(input.inventory_type || input.category);
  const normalized = {
    id: input.id || fallbackId || `${slugify(input.building)}-${Date.now()}`,
    owner: input.owner === "negin" ? "negin" : "ali",
    title: input.title || "",
    area: input.area || "",
    building: input.building || "",
    category: normalizedCategory,
    inventory_type: categoryValueToLabel(normalizedCategory),
    property_type: input.property_type || "apartment",
    bedrooms: input.bedrooms || "",
    size: input.size || "",
    price: input.price || "",
    view: input.view || "",
    furnishing: input.furnishing || "",
    status: input.status || "Available",
    short_description: input.short_description || "",
    notes: input.notes || "",
    image_url: input.image_url || "",
    featured: Boolean(input.featured),
    whatsapp_link: input.whatsapp_link || ""
  };

  if (!normalized.id) {
    normalized.id = `${slugify(normalized.building || normalized.title)}-${Date.now()}`;
  }

  return normalized;
}

export function getBuildingMeta(building, index = 0) {
  return {
    note: buildingMeta[building]?.note || `Curated opportunities in ${building}.`,
    imageClass: buildingMeta[building]?.imageClass || fallbackImages[index % fallbackImages.length]
  };
}

export function groupProperties(properties) {
  const groups = [];
  const byBuilding = new Map();

  properties.forEach((property) => {
    const building = property.building || property.area || "Dubai";
    if (!byBuilding.has(building)) {
      const meta = getBuildingMeta(building, groups.length);
      const group = {
        slug: slugify(building),
        name: building,
        note: meta.note,
        imageClass: meta.imageClass,
        items: []
      };
      byBuilding.set(building, group);
      groups.push(group);
    }

    byBuilding.get(building).items.push(property);
  });

  return groups;
}

function areaForProperty(property, areas = featuredAreas) {
  const haystack = `${property.area || ""} ${property.building || ""}`.toLowerCase();
  const match = areas.find((area) => area.aliases.some((alias) => haystack.includes(alias.toLowerCase())));

  return match || {
    slug: slugify(property.area || "dubai"),
    name: property.area || "Dubai",
    note: `Curated opportunities in ${property.area || "Dubai"}.`,
    imageClass: getBuildingMeta(property.building).imageClass
  };
}

export function groupPropertiesByArea(properties, areas = featuredAreas) {
  const groups = [];
  const byArea = new Map();

  areas.forEach((area) => {
    const group = {
      ...area,
      buildings: [],
      items: []
    };
    byArea.set(area.slug, group);
    groups.push(group);
  });

  properties.forEach((property) => {
    const area = areaForProperty(property, areas);
    if (!byArea.has(area.slug)) {
      const group = {
        ...area,
        buildings: [],
        items: []
      };
      byArea.set(area.slug, group);
      groups.push(group);
    }

    const group = byArea.get(area.slug);
    group.items.push(property);

    const buildingName = property.building || property.area || "Available Properties";
    let building = group.buildings.find((item) => item.name === buildingName);
    if (!building) {
      const meta = getBuildingMeta(buildingName, group.buildings.length);
      building = {
        slug: slugify(buildingName),
        name: buildingName,
        note: meta.note,
        imageClass: meta.imageClass,
        items: []
      };
      group.buildings.push(building);
    }

    building.items.push(property);
  });

  return groups;
}

export async function getPropertyGroups() {
  return groupProperties(await readProperties());
}

export async function getPropertyGroup(slug) {
  const groups = await getPropertyGroups();
  return groups.find((group) => group.slug === slug);
}

export async function getAreaGroups() {
  return groupPropertiesByArea(await readProperties(), await readAreas());
}

export async function getAreaGroup(slug) {
  const groups = await getAreaGroups();
  return groups.find((group) => group.slug === slug);
}
