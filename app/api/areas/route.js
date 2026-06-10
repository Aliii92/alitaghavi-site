import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteSingleArea, normalizeArea, readAreas, upsertSingleArea } from "../../../lib/areas.js";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth.js";
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

function revalidateAreaPaths(owner, slug = "") {
  const paths = ["/", `/prime-areas/${slug}`];
  paths.filter(Boolean).forEach((path) => revalidatePath(path));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get("admin") === "true";
  const requestedOwner = searchParams.get("owner");
  const adminOwner = ownerFromRequest(request);

  if (adminMode && !adminOwner) return forbidden();

  try {
    const owner = adminMode ? adminOwner : requestedOwner ? normalizeOwner(requestedOwner) : "";
    const areas = await readAreas({ allowFallback: !adminMode });
    return success({ items: owner ? areas.filter((area) => area.owner === owner) : areas });
  } catch (error) {
    console.error("[api/areas:GET]", error);
    return failure(error.message || "Could not fetch areas from Supabase.", 500);
  }
}

export async function POST(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const payload = normalizeArea({ ...(await request.json()), owner: adminOwner }, adminOwner);
    const areas = await readAreas({ allowFallback: false });

    if (areas.some((area) => area.owner === adminOwner && (area.id === payload.id || area.slug === payload.slug))) {
      return failure("Area with this ID or slug already exists", 409);
    }

    console.log("[api/areas]", {
      table: "prime_areas",
      action: "create",
      owner: adminOwner,
      payloadKeys: Object.keys(payload || {})
    });
    const savedArea = await upsertSingleArea(payload, adminOwner);
    const verifiedAreas = await readAreas({ allowFallback: false });
    const verifiedArea = verifiedAreas.find((area) => area.owner === adminOwner && area.id === payload.id);

    if (!verifiedArea) {
      throw new Error(`Supabase verification failed: area ${payload.id} is not available after insert.`);
    }

    revalidateAreaPaths(adminOwner, payload.slug);

    return success({ item: savedArea });
  } catch (error) {
    console.error("[api/areas:POST]", error);
    return failure(error.message || "Could not save area to Supabase.", 500);
  }
}

export async function PUT(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const payload = normalizeArea({ ...(await request.json()), owner: adminOwner }, adminOwner);
    const areas = await readAreas({ allowFallback: false });
    const existing = areas.find((area) => area.owner === adminOwner && (area.id === payload.id || area.slug === payload.slug));

    if (!existing) {
      return failure("Area not found", 404);
    }

    console.log("[api/areas]", {
      table: "prime_areas",
      action: "update",
      owner: adminOwner,
      payloadKeys: Object.keys(payload || {})
    });
    const savedArea = await upsertSingleArea(
      normalizeArea({ ...existing, ...payload, owner: adminOwner }, adminOwner),
      adminOwner
    );
    const verifiedAreas = await readAreas({ allowFallback: false });
    const verifiedArea = verifiedAreas.find((area) => area.owner === adminOwner && area.id === savedArea.id);

    if (!verifiedArea) {
      throw new Error(`Supabase verification failed: area ${savedArea.id} is not available after update.`);
    }

    revalidateAreaPaths(adminOwner, savedArea.slug);

    return success({ item: savedArea });
  } catch (error) {
    console.error("[api/areas:PUT]", error);
    return failure(error.message || "Could not update area in Supabase.", 500);
  }
}

export async function DELETE(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const areas = await readAreas({ allowFallback: false });
    const removedArea = areas.find((area) => area.owner === adminOwner && (area.id === id || area.slug === id));

    if (!removedArea) {
      return failure("Area not found", 404);
    }

    console.log("[api/areas]", {
      table: "prime_areas",
      action: "delete",
      owner: adminOwner,
      payloadKeys: ["id"]
    });
    await deleteSingleArea(removedArea.id);
    revalidateAreaPaths(adminOwner, removedArea.slug || id);
    return success({ item: { id: removedArea.id } });
  } catch (error) {
    console.error("[api/areas:DELETE]", error);
    return failure(error.message || "Could not delete area from Supabase.", 500);
  }
}
