import { NextResponse } from "next/server";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth.js";
import { normalizeProject, readProjects, writeProjects } from "../../../lib/projects.js";

function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get("admin") === "true";
  const featuredOnly = searchParams.get("featured") === "true";
  const requestedOwner = searchParams.get("owner");
  const adminOwner = ownerFromRequest(request);

  if (adminMode && !adminOwner) return forbidden();

  const owner = adminMode ? adminOwner : requestedOwner ? normalizeOwner(requestedOwner) : "";
  const projects = (await readProjects()).map((project) => normalizeProject(project, project.id));
  const scopedProjects = owner ? projects.filter((project) => project.owner === owner) : projects;
  return NextResponse.json(featuredOnly ? scopedProjects.filter((project) => project.featured) : scopedProjects);
}

export async function POST(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const payload = await request.json();
  const projects = await readProjects();
  const project = normalizeProject({ ...payload, owner: adminOwner }, payload.id || `${Date.now()}`);

  if (projects.some((item) => item.id === project.id)) {
    return NextResponse.json({ error: "A project with this ID already exists" }, { status: 409 });
  }

  projects.push(project);
  await writeProjects(projects);

  return NextResponse.json(project, { status: 201 });
}
