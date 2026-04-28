import fs from "fs/promises";
import path from "path";
import { hasSupabaseServerConfig, supabaseDelete, supabaseSelect, supabaseUpsert, syncSupabaseTable } from "./supabase-server.js";
import { resolveProjectImage } from "./project-images.js";

const dataFile = path.join(process.cwd(), "data", "projects.json");
export const projectsTable = "off_plan_projects";
const projectTableColumns = [
  "id",
  "title",
  "developer",
  "area",
  "sub_area",
  "starting_price",
  "payment_plan",
  "handover_date",
  "bedrooms",
  "image",
  "whatsapp_link",
  "description",
  "featured",
  "owner"
];

export function slugifyProject(value) {
  return String(value || "project")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeList(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripUnknownSupabaseKeys(payload, allowedColumns = []) {
  const allowed = new Set(allowedColumns);
  return Object.fromEntries(
    Object.entries(payload || {}).filter(([key, value]) => allowed.has(key) && value !== undefined)
  );
}

function mapDbProject(row) {
  return normalizeProject(
    {
      ...row,
      subArea: row.subArea ?? row.sub_area,
      paymentPlan: row.paymentPlan ?? row.payment_plan,
      handoverDate: row.handoverDate ?? row.handover_date,
      startingPrice: row.startingPrice ?? row.starting_price,
      whatsappLink: row.whatsappLink ?? row.whatsapp_link,
      description: row.description ?? row.short_description ?? row.overview ?? row.content ?? row.notes ?? "",
      image: row.image ?? row.image_url ?? row.cover_image ?? row.thumbnail
    },
    row.id
  );
}

function mapProjectToDb(project) {
  return stripUnknownSupabaseKeys(
    {
      id: project.id,
      title: project.title,
      developer: project.developer,
      area: project.area,
      sub_area: project.subArea,
      starting_price: project.startingPrice,
      payment_plan: project.paymentPlan,
      handover_date: project.handoverDate,
      bedrooms: project.bedrooms,
      image: resolveProjectImage(project),
      whatsapp_link: project.whatsappLink,
      description: project.description,
      featured: Boolean(project.featured),
      owner: project.owner
    },
    projectTableColumns
  );
}

async function saveProjectToSupabase(project) {
  const normalized = normalizeProject(project, project.id);
  const payload = mapProjectToDb(normalized);
  console.log("off_plan_projects final payload:", payload);
  console.log("payload keys:", Object.keys(payload));
  console.log("[projects:saveProjectToSupabase]", {
    table: projectsTable,
    action: "upsert",
    payloadKeys: Object.keys(payload)
  });
  await supabaseUpsert(projectsTable, [payload], "id");
}

async function readLocalProjects() {
  try {
    const file = await fs.readFile(dataFile, "utf8");
    const projects = JSON.parse(file);
    return Array.isArray(projects) ? projects : [];
  } catch {
    return [];
  }
}

async function writeLocalProjects(projects) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, `${JSON.stringify(projects, null, 2)}\n`, "utf8");
}

export async function readProjects(options = {}) {
  const { allowFallback = true } = options;
  console.log("[readProjects] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL || "(missing)");
  console.log("[readProjects] Supabase anon key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("[readProjects] table:", projectsTable);
  if (!hasSupabaseServerConfig()) {
    if (!allowFallback) {
      throw new Error("Supabase server configuration is missing for off_plan_projects.");
    }
    return readLocalProjects();
  }

  try {
    const rows = await supabaseSelect(projectsTable, { order: "id.asc" });
    console.log("[readProjects] rows fetched:", Array.isArray(rows) ? rows.length : 0);
    return (Array.isArray(rows) ? rows : []).map((row) => mapDbProject(row));
  } catch (error) {
    console.error("[readProjects] Supabase fetch failed:", error);
    if (!allowFallback) {
      throw error;
    }
    console.warn("[readProjects] Falling back to local JSON:", error.message || error);
    return readLocalProjects();
  }
}

export async function upsertSingleProject(project) {
  const normalized = normalizeProject(project, project.id);

  if (!hasSupabaseServerConfig()) {
    const projects = await readLocalProjects();
    const index = projects.findIndex((item) => item.id === normalized.id);
    if (index >= 0) {
      projects[index] = normalized;
    } else {
      projects.push(normalized);
    }
    await writeLocalProjects(projects);
    return normalized;
  }

  await saveProjectToSupabase(normalized);
  const savedRows = await supabaseSelect(projectsTable, { id: `eq.${normalized.id}` });
  const saved = Array.isArray(savedRows) ? savedRows[0] : null;
  if (!saved) {
    throw new Error(`Supabase verification failed: project ${normalized.id} was not found after save.`);
  }

  return mapDbProject(saved);
}

export async function deleteSingleProject(id) {
  if (!hasSupabaseServerConfig()) {
    const projects = await readLocalProjects();
    await writeLocalProjects(projects.filter((project) => project.id !== id));
    return;
  }

  await supabaseDelete(projectsTable, { id: `eq.${id}` });
}

export async function writeProjects(projects) {
  if (!hasSupabaseServerConfig()) {
    await writeLocalProjects(projects);
    return;
  }

  const normalized = projects.map((project) => normalizeProject(project, project.id));
  await syncSupabaseTable(projectsTable, normalized.map((project) => mapProjectToDb(project)));
}

export function normalizeProject(input, fallbackId = "") {
  const normalized = {
    id: input.id || fallbackId || slugifyProject(input.title),
    owner: input.owner === "negin" ? "negin" : "ali",
    title: input.title || "",
    developer: input.developer || "",
    area: input.area || "",
    subArea: input.subArea || "",
    startingPrice: input.startingPrice || "",
    paymentPlan: input.paymentPlan || "",
    handoverDate: input.handoverDate || "",
    bedrooms: input.bedrooms || "",
    description: input.description || "",
    notes: input.notes || "",
    features: normalizeList(input.features),
    image: resolveProjectImage(input),
    whatsappLink: input.whatsappLink || "",
    featured: Boolean(input.featured)
  };

  if (!normalized.id) {
    normalized.id = `${slugifyProject(normalized.title || normalized.developer)}-${Date.now()}`;
  }

  return normalized;
}

export function projectToProperty(project) {
  return {
    id: project.id,
    owner: project.owner === "negin" ? "negin" : "ali",
    title: project.title,
    area: [project.area, project.subArea].filter(Boolean).join(" / "),
    building: project.developer,
    category: "off-plan",
    property_type: "off-plan project",
    bedrooms: project.bedrooms,
    image_url: resolveProjectImage(project),
    price: project.startingPrice,
    view: project.subArea,
    handoverDate: project.handoverDate,
    short_description: project.description,
    notes: [project.paymentPlan, project.handoverDate].filter(Boolean).join(" | ")
  };
}
