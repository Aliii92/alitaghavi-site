import fs from "fs/promises";
import path from "path";

const dataFile = path.join(process.cwd(), "data", "projects.json");

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

export async function readProjects() {
  try {
    const file = await fs.readFile(dataFile, "utf8");
    const projects = JSON.parse(file);
    return Array.isArray(projects) ? projects : [];
  } catch {
    return [];
  }
}

export async function writeProjects(projects) {
  await fs.mkdir(path.dirname(dataFile), { recursive: true });
  await fs.writeFile(dataFile, `${JSON.stringify(projects, null, 2)}\n`, "utf8");
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
