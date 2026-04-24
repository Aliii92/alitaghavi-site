import fs from "fs/promises";
import path from "path";

const projectRoot = process.cwd();

function env(name) {
  return process.env[name] || "";
}

const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase env vars. Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

function headers() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation"
  };
}

async function readJson(fileName) {
  const fullPath = path.join(projectRoot, "data", fileName);
  const raw = await fs.readFile(fullPath, "utf8");
  return JSON.parse(raw);
}

async function upsert(table, rows, onConflict = "id") {
  if (!rows.length) return [];

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(rows)
  });

  const text = await response.text();
  let payload = null;

  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(`Failed to upsert ${table}: ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
  }

  return payload;
}

function normalizeCategory(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "off-plan" || raw === "offplan" || raw === "off plan") return "off-plan";
  if (raw === "resale-off-plan" || raw === "resale off-plan" || raw === "resale off plan") return "resale-off-plan";
  return "ready";
}

function inventoryLabel(category) {
  if (category === "off-plan") return "Off-plan";
  if (category === "resale-off-plan") return "Resale Off-Plan";
  return "Ready";
}

function mapProperty(property) {
  const category = normalizeCategory(property.inventory_type || property.category);
  return {
    id: property.id,
    title: property.title || "",
    area: property.area || "",
    building: property.building || "",
    inventory_type: inventoryLabel(category),
    property_type: property.property_type || "apartment",
    bedrooms: property.bedrooms || "",
    size: property.size || "",
    price: property.price || "",
    view: property.view || "",
    furnishing: property.furnishing || "",
    status: property.status || "Available",
    short_description: property.short_description || "",
    notes: property.notes || "",
    image_url: property.image_url || "",
    featured: Boolean(property.featured),
    whatsapp_link: property.whatsapp_link || "",
    owner: property.owner === "negin" ? "negin" : "ali",
    category
  };
}

function mapProject(project) {
  return {
    id: project.id,
    title: project.title || "",
    developer: project.developer || "",
    area: project.area || "",
    sub_area: project.subArea || "",
    starting_price: project.startingPrice || "",
    payment_plan: project.paymentPlan || "",
    handover_date: project.handoverDate || "",
    bedrooms: project.bedrooms || "",
    description: project.description || "",
    features: Array.isArray(project.features) ? project.features : [],
    image: project.image || "",
    whatsapp_link: project.whatsappLink || "",
    featured: Boolean(project.featured),
    owner: project.owner === "negin" ? "negin" : "ali"
  };
}

function mapArea(area) {
  return {
    id: area.id,
    owner: area.owner === "negin" ? "negin" : "ali",
    slug: area.slug || "",
    name: area.name || area.area_name || "",
    area_name: area.area_name || area.name || "",
    short_title: area.short_title || "",
    overview_card_title: area.overview_card_title || area.name || "",
    aliases: Array.isArray(area.aliases) ? area.aliases : [],
    note: area.note || "",
    excerpt: area.excerpt || area.short_description || area.note || "",
    short_description: area.short_description || area.note || "",
    hero_title: area.hero_title || "",
    featured_image: area.featured_image || area.image_url || "",
    content_body: area.content_body || "",
    full_description: area.full_description || "",
    lifestyle_text: area.lifestyle_text || "",
    investment_analysis: area.investment_analysis || "",
    bullet_points: Array.isArray(area.bullet_points) ? area.bullet_points : [],
    notes: Array.isArray(area.notes) ? area.notes : [],
    image_url: area.image_url || "",
    seo_title: area.seo_title || "",
    seo_description: area.seo_description || "",
    gallery_images: Array.isArray(area.gallery_images) ? area.gallery_images : [],
    featured: area.featured !== false,
    active: area.active !== false,
    display_order: Number(area.display_order || 0)
  };
}

async function main() {
  const [properties, projects, areas] = await Promise.all([
    readJson("properties.json"),
    readJson("projects.json"),
    readJson("areas.json")
  ]);

  const mappedProperties = properties.map(mapProperty);
  const readyProperties = mappedProperties.filter((property) => property.category !== "resale-off-plan");
  const resaleProperties = mappedProperties.filter((property) => property.category === "resale-off-plan");

  const results = await Promise.all([
    upsert("properties", readyProperties),
    upsert("resale_off_plan", resaleProperties),
    upsert("off_plan_projects", projects.map(mapProject)),
    upsert("prime_areas", areas.map(mapArea))
  ]);

  console.log(`Imported ${readyProperties.length} rows into properties`);
  console.log(`Imported ${resaleProperties.length} rows into resale_off_plan`);
  console.log(`Imported ${projects.length} rows into off_plan_projects`);
  console.log(`Imported ${areas.length} rows into prime_areas`);
  console.log("Supabase import complete.");
  return results;
}

main().catch((error) => {
  console.error("[import-local-data-to-supabase]", error);
  process.exit(1);
});
