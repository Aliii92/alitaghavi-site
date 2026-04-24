import fs from "fs/promises";
import path from "path";
import { hasSupabaseServerConfig, supabaseSelect, syncSupabaseTable } from "./supabase-server.js";

const dataFile = path.join(process.cwd(), "data", "projects.json");
const projectsTable = "off_plan_projects";

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

function mapDbProject(row) {
  return normalizeProject(row, row.id);
}

function mapProjectToDb(project) {
  return {
    id: project.id,
    owner: project.owner,
    title: project.title,
    developer: project.developer,
    area: project.area,
    sub_area: project.subArea,
    payment_plan: project.paymentPlan,
    handover_date: project.handoverDate,
    starting_price: project.startingPrice,
    bedrooms: project.bedrooms,
    description: project.description,
    features: project.features,
    image: project.image,
    whatsapp_link: project.whatsappLink,
    featured: Boolean(project.featured)
  };
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

export async function readProjects() {
  if (!hasSupabaseServerConfig()) {
    return readLocalProjects();
  }

  const rows = await supabaseSelect(projectsTable, { order: "id.asc" });
  return (Array.isArray(rows) ? rows : []).map((row) =>
    mapDbProject({
      ...row,
      subArea: row.subArea ?? row.sub_area,
      paymentPlan: row.paymentPlan ?? row.payment_plan,
      handoverDate: row.handoverDate ?? row.handover_date,
      startingPrice: row.startingPrice ?? row.starting_price,
      whatsappLink: row.whatsappLink ?? row.whatsapp_link
    })
  );
}

export async function writeProjects(projects) {
  if (!hasSupabaseServerConfig()) {
    await writeLocalProjects(projects);
    return;
  }

  const normalized = projects.map((project) => normalizeProject(project, project.id));
  await syncSupabaseTable(projectsTable, normalized.map(mapProjectToDb));
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
    features: normalizeList(input.features),
    image: input.image || "",
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
    image_url: project.image,
    price: project.startingPrice,
    view: project.subArea,
    handoverDate: project.handoverDate,
    short_description: project.description,
    notes: [project.paymentPlan, project.handoverDate].filter(Boolean).join(" | ")
  };
}
