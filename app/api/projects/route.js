import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth.js";
import { normalizeProject, readProjects, upsertSingleProject } from "../../../lib/projects.js";
import { hasSupabaseServerConfig } from "../../../lib/supabase-server.js";

function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function revalidateProjectPaths(owner) {
  const paths = owner === "negin"
    ? ["/negin", "/negin/off-plan", "/negin/projects"]
    : ["/", "/off-plan-projects", "/projects"];
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
    return NextResponse.json(featuredOnly ? scopedProjects.filter((project) => project.featured) : scopedProjects);
  } catch (error) {
    console.error("[api/projects:GET]", error);
    return NextResponse.json({ error: error.message || "Could not fetch projects from Supabase." }, { status: 500 });
  }
}

export async function POST(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const payload = await request.json();
    const projects = await readProjects({ allowFallback: false });
    const project = normalizeProject({ ...payload, owner: adminOwner }, payload.id || `${Date.now()}`);

    if (projects.some((item) => item.id === project.id)) {
      return NextResponse.json({ error: "A project with this ID already exists" }, { status: 409 });
    }

    const savedProject = await upsertSingleProject(project);
    const verifiedProjects = await readProjects({ allowFallback: false });
    const verifiedProject = verifiedProjects.find((item) => item.id === project.id && item.owner === adminOwner);

    if (!verifiedProject) {
      throw new Error(`Supabase verification failed: project ${project.id} is not available after insert.`);
    }

    revalidateProjectPaths(adminOwner);

    return NextResponse.json(savedProject, { status: 201 });
  } catch (error) {
    console.error("[api/projects:POST]", error);
    return NextResponse.json({ error: error.message || "Could not save project to Supabase." }, { status: 500 });
  }
}
