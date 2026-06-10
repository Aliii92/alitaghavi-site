import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth.js";
import { normalizeProject, readProjects, upsertSingleProject } from "../../../lib/projects.js";
import { hasSupabaseServerConfig } from "../../../lib/supabase-server.js";

function forbidden() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function success(payload = {}, status = 200) {
  return NextResponse.json({ success: true, ...payload }, { status });
}

function failure(error, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

function logAction(action, owner, payload = {}) {
  console.log("[api/projects]", {
    table: "off_plan_projects",
    action,
    owner,
    payloadKeys: Object.keys(payload || {})
  });
}

function revalidateProjectPaths() {
  const paths = ["/", "/off-plan-projects", "/projects"];
  paths.forEach((path) => revalidatePath(path));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get("admin") === "true";
  const featuredOnly = searchParams.get("featured") === "true";
  const requestedOwner = searchParams.get("owner");
  const adminOwner = ownerFromRequest(request);

  if (adminMode && !adminOwner) return forbidden();

  const owner = adminMode ? adminOwner : requestedOwner ? normalizeOwner(requestedOwner) : "";
  try {
    const projects = (await readProjects({ allowFallback: !adminMode })).map((project) => normalizeProject(project, project.id));
    const scopedProjects = owner ? projects.filter((project) => project.owner === owner) : projects;
    return success({ items: featuredOnly ? scopedProjects.filter((project) => project.featured) : scopedProjects });
  } catch (error) {
    console.error("[api/projects:GET]", error);
    return failure(error.message || "Could not fetch projects from Supabase.", 500);
  }
}

export async function POST(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const payload = await request.json();
    const projects = await readProjects({ allowFallback: false });
    const project = normalizeProject({ ...payload, owner: adminOwner }, payload.id || `${Date.now()}`);
    logAction("create", adminOwner, payload);

    if (projects.some((item) => item.id === project.id)) {
      return failure("A project with this ID already exists", 409);
    }

    const savedProject = await upsertSingleProject(project);
    const verifiedProjects = await readProjects({ allowFallback: false });
    const verifiedProject = verifiedProjects.find((item) => item.id === project.id && item.owner === adminOwner);

    if (!verifiedProject) {
      throw new Error(`Supabase verification failed: project ${project.id} is not available after insert.`);
    }

    revalidateProjectPaths(adminOwner);

    return success({ item: savedProject }, 201);
  } catch (error) {
    console.error("[api/projects:POST]", error);
    return failure(error.message || "Could not save project to Supabase.", 500);
  }
}
