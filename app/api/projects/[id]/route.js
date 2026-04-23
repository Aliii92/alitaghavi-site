import { NextResponse } from "next/server";
import { ownerFromRequest } from "../../../../lib/adminAuth.js";
import { normalizeProject, readProjects, writeProjects } from "../../../../lib/projects.js";

function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PUT(request, { params }) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const { id } = await params;
  const payload = await request.json();
  const projects = await readProjects();
  const index = projects.findIndex((project) => project.id === id && normalizeProject(project, project.id).owner === adminOwner);

  if (index === -1) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  projects[index] = normalizeProject({ ...projects[index], ...payload, id, owner: adminOwner }, id);
  await writeProjects(projects);

  return NextResponse.json(projects[index]);
}

export async function DELETE(_request, { params }) {
  const adminOwner = ownerFromRequest(_request);
  if (!adminOwner) return forbidden();

  const { id } = await params;
  const projects = await readProjects();
  const nextProjects = projects.filter(
    (project) => !(project.id === id && normalizeProject(project, project.id).owner === adminOwner)
  );

  if (nextProjects.length === projects.length) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await writeProjects(nextProjects);

  return NextResponse.json({ ok: true });
}
