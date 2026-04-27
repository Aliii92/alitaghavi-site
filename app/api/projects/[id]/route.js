import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ownerFromRequest } from "../../../../lib/adminAuth.js";
import { deleteSingleProject, normalizeProject, readProjects, upsertSingleProject } from "../../../../lib/projects.js";
import { hasSupabaseServerConfig } from "../../../../lib/supabase-server.js";

function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function revalidateProjectPaths(owner) {
  const paths = owner === "negin"
    ? ["/negin", "/negin/off-plan", "/negin/projects"]
    : ["/", "/off-plan-projects", "/projects"];
  paths.forEach((path) => revalidatePath(path));
}

export async function PUT(request, { params }) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const { id } = await params;
    const payload = await request.json();
    const projects = await readProjects({ allowFallback: false });
    const existing = projects.find((project) => project.id === id && normalizeProject(project, project.id).owner === adminOwner);

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const savedProject = await upsertSingleProject(
      normalizeProject({ ...existing, ...payload, id, owner: adminOwner }, id)
    );
    const verifiedProjects = await readProjects({ allowFallback: false });
    const verifiedProject = verifiedProjects.find((project) => project.id === id && project.owner === adminOwner);

    if (!verifiedProject) {
      throw new Error(`Supabase verification failed: project ${id} is not available after update.`);
    }

    revalidateProjectPaths(adminOwner);

    return NextResponse.json(savedProject);
  } catch (error) {
    console.error("[api/projects/[id]:PUT]", error);
    return NextResponse.json({ error: error.message || "Could not update project in Supabase." }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const adminOwner = ownerFromRequest(_request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const { id } = await params;
    const projects = await readProjects({ allowFallback: false });
    const existing = projects.find(
      (project) => project.id === id && normalizeProject(project, project.id).owner === adminOwner
    );

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await deleteSingleProject(id);
    revalidateProjectPaths(adminOwner);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/projects/[id]:DELETE]", error);
    return NextResponse.json({ error: error.message || "Could not delete project from Supabase." }, { status: 500 });
  }
}
