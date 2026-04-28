import fs from "fs/promises";
import path from "path";
import { hasSupabaseServerConfig, supabaseDelete, supabaseSelect, supabaseUpsert, syncSupabaseTable } from "./supabase-server.js";
import { resolveProjectImage } from "./project-images.js";

const dataFile = path.join(process.cwd(), "data", "projects.json");
export const projectsTable = "off_plan_projects";
const projectBaseColumns = ["id", "owner", "title", "developer", "area", "bedrooms", "image", "featured"];
const projectFieldCandidates = {
  id: ["id"],
  owner: ["owner"],
  title: ["title"],
  developer: ["developer"],
  area: ["area"],
  subArea: ["sub_area", "subArea"],
  startingPrice: ["starting_price", "startingPrice"],
  paymentPlan: ["payment_plan", "paymentPlan"],
  handoverDate: ["handover_date", "handoverDate"],
  bedrooms: ["bedrooms"],
  image: ["image", "image_url"],
  whatsappLink: ["whatsapp_link", "whatsappLink"],
  featured: ["featured"],
  features: ["features"]
};

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

function inferProjectSchemaColumns(rows = []) {
  const keys = new Set(projectBaseColumns);
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    Object.keys(row || {}).forEach((key) => keys.add(key));
  });
  return keys;
}

function pickSchemaKey(candidates = [], schemaColumns = new Set()) {
  return candidates.find((key) => schemaColumns.has(key)) || "";
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
      notes: row.notes ?? "",
      features: row.features ?? [],
      image: row.image ?? row.image_url ?? row.cover_image ?? row.thumbnail
    },
    row.id
  );
}

function mapProjectToDb(project, schemaColumns = new Set(projectBaseColumns)) {
  const payload = {};
  const omittedColumns = [];
  const fieldValues = {
    id: project.id,
    owner: project.owner,
    title: project.title,
    developer: project.developer,
    area: project.area,
    subArea: project.subArea,
    startingPrice: project.startingPrice,
    paymentPlan: project.paymentPlan,
    handoverDate: project.handoverDate,
    bedrooms: project.bedrooms,
    image: resolveProjectImage(project),
    whatsappLink: project.whatsappLink,
    featured: Boolean(project.featured),
    features: project.features
  };

  Object.entries(projectFieldCandidates).forEach(([field, candidates]) => {
    const value = fieldValues[field];
    if (value === undefined || value === null || value === "") return;

    if (field === "features" && (!Array.isArray(value) || !value.length)) return;

    const schemaKey = pickSchemaKey(candidates, schemaColumns);
    if (!schemaKey) {
      if (!["id", "owner", "title", "developer", "area", "bedrooms", "image", "featured"].includes(field)) {
        omittedColumns.push(field);
      }
      return;
    }

    payload[schemaKey] = value;
  });

  return {
    payload: stripUnknownSupabaseKeys(payload, Array.from(schemaColumns)),
    omittedColumns
  };
}

async function saveProjectToSupabase(project) {
  const normalized = normalizeProject(project, project.id);
  const existingRows = await supabaseSelect(projectsTable, { order: "id.asc" });
  const schemaColumns = inferProjectSchemaColumns(existingRows);
  const { payload, omittedColumns } = mapProjectToDb(normalized, schemaColumns);
  console.log("off_plan_projects final payload:", payload);
  console.log("payload keys:", Object.keys(payload));
  console.log("[projects:saveProjectToSupabase]", {
    table: projectsTable,
    action: "upsert",
    payloadKeys: Object.keys(payload),
    omittedColumns
  });
  if (omittedColumns.length) {
    console.warn("[projects:saveProjectToSupabase] omitted project fields because matching Supabase columns were not found:", omittedColumns);
  }
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
  if (!hasSupabaseServerConfig()) {
    if (!allowFallback) {
      throw new Error("Supabase server configuration is missing for off_plan_projects.");
    }
    return readLocalProjects();
  }

  try {
    const rows = await supabaseSelect(projectsTable, { order: "id.asc" });
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
  const existingRows = await supabaseSelect(projectsTable, { order: "id.asc" });
  const schemaColumns = inferProjectSchemaColumns(existingRows);
  await syncSupabaseTable(
    projectsTable,
    normalized.map((project) => mapProjectToDb(project, schemaColumns).payload)
  );
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
