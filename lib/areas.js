import fs from "fs/promises";
import path from "path";
import { hasSupabaseServerConfig, supabaseDelete, supabaseSelect, supabaseUpsert, syncSupabaseTable } from "./supabase-server.js";

const dataFile = path.join(process.cwd(), "data", "areas.json");
export const areasTable = "prime_areas";

export function slugifyArea(value) {
  return String(value || "area")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const defaultAreas = [
  {
    id: "ali-palm-jumeirah",
    owner: "ali",
    slug: "palm-jumeirah",
    name: "Palm Jumeirah",
    area_name: "Palm Jumeirah",
    short_title: "Iconic Waterfront Living",
    overview_card_title: "Palm Jumeirah",
    aliases: ["Palm Jumeirah"],
    note: "Dubai's signature waterfront address for branded residences, beach homes, and rare views.",
    short_description: "Dubai's signature waterfront address for branded residences, beach homes, and rare views.",
    hero_title: "Palm Jumeirah Area Insight",
    full_description: "Palm Jumeirah is one of Dubai's most recognizable waterfront destinations, known for branded residences, private beaches, resort-led lifestyle, and limited trophy addresses.",
    lifestyle_text: "The area appeals to buyers who want a resort-style daily experience with beach access, dining, wellness amenities, and a globally recognized address.",
    investment_analysis: "Palm Jumeirah remains attractive for end-users and investors because of scarcity, strong international demand, and long-term prestige value.",
    bullet_points: ["Iconic beachfront address", "Branded and luxury residences", "Strong lifestyle appeal", "High long-term prestige value"],
    image_url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1400&q=80",
    gallery_images: [],
    featured: true,
    active: true,
    display_order: 1
  },
  {
    id: "ali-downtown",
    owner: "ali",
    slug: "downtown",
    name: "Downtown",
    area_name: "Downtown",
    short_title: "Central Dubai Prestige",
    overview_card_title: "Downtown",
    aliases: ["Downtown", "Downtown Dubai"],
    note: "Iconic city living with Burj Khalifa views, global demand, and proven rental appeal.",
    short_description: "Iconic city living with Burj Khalifa views, global demand, and proven rental appeal.",
    hero_title: "Downtown Dubai Area Insight",
    full_description: "Downtown Dubai is the city's flagship urban district, home to Burj Khalifa, Dubai Mall, premium residences, and a strong lifestyle ecosystem.",
    lifestyle_text: "It suits buyers who value central access, walkability, hospitality, shopping, dining, and a polished city lifestyle.",
    investment_analysis: "Downtown continues to hold strong appeal due to global recognition, mature infrastructure, rental demand, and limited prime-view inventory.",
    bullet_points: ["Burj Khalifa district", "High rental demand", "Central lifestyle", "Established luxury market"],
    image_url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
    gallery_images: [],
    featured: true,
    active: true,
    display_order: 2
  },
  {
    id: "ali-bluewaters",
    owner: "ali",
    slug: "bluewaters",
    name: "Bluewaters",
    area_name: "Bluewaters",
    short_title: "Waterfront Island Living",
    overview_card_title: "Bluewaters",
    aliases: ["Bluewaters", "Bluewaters Residence"],
    note: "A refined waterfront destination with sea views, landmark lifestyle appeal, and curated luxury residences.",
    short_description: "A refined waterfront destination with sea views, landmark lifestyle appeal, and curated luxury residences.",
    hero_title: "Bluewaters Area Insight",
    full_description: "Bluewaters offers a distinctive island lifestyle with sea views, pedestrian-friendly retail, hospitality, and proximity to JBR and Dubai Marina.",
    lifestyle_text: "It is ideal for clients seeking a calm waterfront setting while staying close to restaurants, beach lifestyle, and city convenience.",
    investment_analysis: "The limited island supply, strong lifestyle positioning, and premium waterfront character make Bluewaters a focused luxury opportunity.",
    bullet_points: ["Island lifestyle", "Sea and Ain Dubai views", "Limited waterfront supply", "Premium resale appeal"],
    image_url: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1400&q=80",
    gallery_images: [],
    featured: true,
    active: true,
    display_order: 3
  },
  {
    id: "ali-meydan",
    owner: "ali",
    slug: "meydan",
    name: "Meydan",
    area_name: "Meydan",
    short_title: "Strategic Growth District",
    overview_card_title: "Meydan",
    aliases: ["Meydan"],
    note: "A strategic growth district for villas, new luxury communities, and long-term upside.",
    short_description: "A strategic growth district for villas, new luxury communities, and long-term upside.",
    hero_title: "Meydan Area Insight",
    full_description: "Meydan is a growth-led district combining luxury communities, villa living, improving infrastructure, and proximity to central Dubai.",
    lifestyle_text: "The area appeals to families and long-term residents who want larger layouts, calmer surroundings, and access to new lifestyle communities.",
    investment_analysis: "Meydan's appeal is driven by development momentum, infrastructure expansion, and growing demand for luxury residential communities near the city.",
    bullet_points: ["Growth corridor positioning", "Strong future infrastructure", "Investor-friendly entry point", "Large-format luxury communities"],
    image_url: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1400&q=80",
    gallery_images: [],
    featured: true,
    active: true,
    display_order: 4
  }
];

function normalizeOwner(owner) {
  return owner === "negin" ? "negin" : "ali";
}

function ownerScopedDefaults() {
  return ["ali", "negin"].flatMap((owner) =>
    defaultAreas.map((area) =>
      normalizeArea({
        ...area,
        id: `${owner}-${area.slug}`,
        owner
      }, owner)
    )
  );
}

function mapAreaToDb(area) {
  return {
    id: area.id,
    owner: area.owner,
    slug: area.slug,
    name: area.name,
    area_name: area.area_name,
    short_title: area.short_title,
    overview_card_title: area.overview_card_title,
    aliases: area.aliases,
    note: area.note,
    excerpt: area.excerpt,
    short_description: area.short_description,
    hero_title: area.hero_title,
    featured_image: area.featured_image,
    content_body: area.content_body,
    full_description: area.full_description,
    lifestyle_text: area.lifestyle_text,
    investment_analysis: area.investment_analysis,
    bullet_points: area.bullet_points,
    notes: area.notes,
    image_url: area.image_url,
    seo_title: area.seo_title,
    seo_description: area.seo_description,
    gallery_images: area.gallery_images,
    featured: Boolean(area.featured),
    active: Boolean(area.active),
    display_order: Number(area.display_order || 0)
  };
}

async function readLocalAreas() {
  try {
    const file = await fs.readFile(dataFile, "utf8");
    const areas = JSON.parse(file);
    if (!Array.isArray(areas)) return ownerScopedDefaults();
    const normalized = areas.map((area) => normalizeArea(area, area.owner));
    const hasOwners = normalized.some((area) => area.owner === "negin");
    if (hasOwners) return normalized;
    return ["ali", "negin"].flatMap((owner) =>
      normalized.map((area) => normalizeArea({ ...area, id: `${owner}-${area.slug}`, owner }, owner))
    );
  } catch {
    return ownerScopedDefaults();
  }
}

async function writeLocalAreas(areas) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, `${JSON.stringify(areas, null, 2)}\n`, "utf8");
}

export async function readAreas(options = {}) {
  const { allowFallback = true } = options;
  if (!hasSupabaseServerConfig()) {
    if (!allowFallback) {
      throw new Error("Supabase server configuration is missing for prime_areas.");
    }
    return readLocalAreas();
  }

  try {
    const rows = await supabaseSelect(areasTable, { order: "display_order.asc.nullslast" });
    const normalized = (Array.isArray(rows) ? rows : []).map((area) => normalizeArea(area, area.owner));
    return normalized.length ? normalized : ownerScopedDefaults();
  } catch (error) {
    console.error("[readAreas] Supabase fetch failed:", error);
    if (!allowFallback) {
      throw error;
    }
    console.warn("[readAreas] Falling back to local JSON:", error.message || error);
    return readLocalAreas();
  }
}

export async function upsertSingleArea(area, fallbackOwner = "ali") {
  const normalized = normalizeArea(area, fallbackOwner);

  if (!hasSupabaseServerConfig()) {
    const areas = await readLocalAreas();
    const index = areas.findIndex((item) => item.id === normalized.id);
    if (index >= 0) {
      areas[index] = normalized;
    } else {
      areas.push(normalized);
    }
    await writeLocalAreas(areas);
    return normalized;
  }

  await supabaseUpsert(areasTable, [mapAreaToDb(normalized)], "id");
  const savedRows = await supabaseSelect(areasTable, { id: `eq.${normalized.id}` });
  const saved = Array.isArray(savedRows) ? savedRows[0] : null;
  if (!saved) {
    throw new Error(`Supabase verification failed: area ${normalized.id} was not found after save.`);
  }

  return normalizeArea(saved, saved.owner || fallbackOwner);
}

export async function deleteSingleArea(id) {
  if (!hasSupabaseServerConfig()) {
    const areas = await readLocalAreas();
    await writeLocalAreas(areas.filter((area) => area.id !== id && area.slug !== id));
    return;
  }

  await Promise.all([
    supabaseDelete(areasTable, { id: `eq.${id}` }),
    supabaseDelete(areasTable, { slug: `eq.${id}` })
  ]);
}

export async function writeAreas(areas) {
  if (!hasSupabaseServerConfig()) {
    await writeLocalAreas(areas);
    return;
  }

  const normalized = areas.map((area) => normalizeArea(area, area.owner));
  await syncSupabaseTable(areasTable, normalized.map(mapAreaToDb));
}

export function normalizeArea(input, fallbackOwner = "ali") {
  const owner = normalizeOwner(input.owner || fallbackOwner);
  const slug = slugifyArea(input.slug || input.id || input.area_name || input.name);
  const name = input.area_name || input.name || input.overview_card_title || "";
  const bulletPoints = Array.isArray(input.bullet_points)
    ? input.bullet_points
    : Array.isArray(input.notes)
      ? input.notes
      : String(input.bullet_points || input.highlights || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    id: input.id || `${owner}-${slug}`,
    owner,
    slug,
    name,
    area_name: name,
    short_title: input.short_title || "",
    overview_card_title: input.overview_card_title || name,
    aliases: Array.isArray(input.aliases)
      ? input.aliases
      : String(input.aliases || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    note: input.note || input.short_description || "",
    excerpt: input.excerpt || input.short_description || input.note || "",
    short_description: input.short_description || input.note || "",
    hero_title: input.hero_title || `${name} Area Insight`,
    featured_image: input.featured_image || input.image_url || "",
    content_body:
      input.content_body ||
      input.rich_content_body ||
      input.content_html ||
      buildLegacyAreaBody({
        name,
        full_description: input.full_description || input.note || input.short_description || "",
        lifestyle_text: input.lifestyle_text || "",
        investment_analysis: input.investment_analysis || ""
      }),
    full_description: input.full_description || input.note || input.short_description || "",
    lifestyle_text: input.lifestyle_text || "",
    investment_analysis: input.investment_analysis || "",
    bullet_points: bulletPoints,
    notes: bulletPoints,
    image_url: input.image_url || "",
    seo_title: input.seo_title || `${name} Area Insight`,
    seo_description:
      input.seo_description || input.excerpt || input.short_description || input.note || "",
    gallery_images: Array.isArray(input.gallery_images)
      ? input.gallery_images
      : String(input.gallery_images || "")
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    featured: input.featured !== false,
    active: input.active !== false,
    display_order: Number(input.display_order || 0)
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLegacyAreaBody({ name, full_description, lifestyle_text, investment_analysis }) {
  const sections = [];

  if (full_description) {
    sections.push(`<h2>Overview</h2><p>${escapeHtml(full_description)}</p>`);
  }
  if (lifestyle_text) {
    sections.push(`<h2>Lifestyle</h2><p>${escapeHtml(lifestyle_text)}</p>`);
  }
  if (investment_analysis) {
    sections.push(`<h2>Investment Perspective</h2><p>${escapeHtml(investment_analysis)}</p>`);
  }

  return sections.length
    ? sections.join("\n")
    : `<p>${escapeHtml(`${name} remains a premium Dubai area worth exploring for lifestyle and investment decisions.`)}</p>`;
}

export function sanitizeAreaHtml(html = "") {
  return String(html || "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

export async function readPublicAreas() {
  const areas = await readAreas();
  return areas
    .filter((area) => area.active && area.featured)
    .sort((left, right) => (left.display_order || 0) - (right.display_order || 0) || left.name.localeCompare(right.name));
}

export async function readAreasByOwner(owner = "ali") {
  const normalizedOwner = normalizeOwner(owner);
  const areas = await readAreas();
  return areas.filter((area) => area.owner === normalizedOwner);
}

export async function readPublicAreasByOwner(owner = "ali") {
  const areas = await readAreasByOwner(owner);
  return areas
    .filter((area) => area.active && area.featured)
    .sort((left, right) => (left.display_order || 0) - (right.display_order || 0) || left.name.localeCompare(right.name));
}
