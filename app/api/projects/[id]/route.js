import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ownerFromRequest } from "../../../../lib/adminAuth.js";
import { deleteSingleProject, normalizeProject, readProjects, upsertSingleProject } from "../../../../lib/projects.js";
import { hasSupabaseServerConfig } from "../../../../lib/supabase-server.js";

function forbidden() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function success(payload = {}, status = 200) {
  return NextResponse.json({ success: true, ...payload }, { status });
}

function failure(error, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

function revalidateProjectPaths(owner) {
  const paths = ["/", "/off-plan-projects", "/projects"];
  paths.forEach((path) => revalidatePath(path));
}

export async function PUT(request, { params }) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const { id } = await params;
    const payload = await request.json();
    const projects = await readProjects({ allowFallback: false });
    const existing = projects.find((project) => project.id === id && normalizeProject(project, project.id).owner === adminOwner);
    console.log("[api/projects/[id]]", {
      table: "off_plan_projects",
      action: "update",
      owner: adminOwner,
      id,
      payloadKeys: Object.keys(payload || {})
    });

    if (!existing) {
      return failure("Project not found", 404);
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

    return success({ item: savedProject });
  } catch (error) {
    console.error("[api/projects/[id]:PUT]", error);
    return failure(error.message || "Could not update project in Supabase.", 500);
  }
}

export async function DELETE(_request, { params }) {
  const adminOwner = ownerFromRequest(_request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const { id } = await params;
    const projects = await readProjects({ allowFallback: false });
    const existing = projects.find(
      (project) => project.id === id && normalizeProject(project, project.id).owner === adminOwner
    );

    if (!existing) {
      return failure("Project not found", 404);
    }

    console.log("[api/projects/[id]]", {
      table: "off_plan_projects",
      action: "delete",
      owner: adminOwner,
      id
    });
    await deleteSingleProject(id);
    revalidateProjectPaths(adminOwner);

    return success({ item: { id } });
  } catch (error) {
    console.error("[api/projects/[id]:DELETE]", error);
    return failure(error.message || "Could not delete project from Supabase.", 500);
  }
}
