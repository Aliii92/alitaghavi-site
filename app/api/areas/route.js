import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { deleteSingleArea, normalizeArea, readAreas, upsertSingleArea } from "../../../lib/areas.js";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth.js";
import { hasSupabaseServerConfig } from "../../../lib/supabase-server.js";

function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function revalidateAreaPaths(owner, slug = "") {
  const paths = owner === "negin"
    ? ["/negin", `/prime-areas/negin-${slug}`]
    : ["/", `/prime-areas/${slug}`];
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
    return NextResponse.json(owner ? areas.filter((area) => area.owner === owner) : areas);
  } catch (error) {
    console.error("[api/areas:GET]", error);
    return NextResponse.json({ error: error.message || "Could not fetch areas from Supabase." }, { status: 500 });
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

    const payload = normalizeArea({ ...(await request.json()), owner: adminOwner }, adminOwner);
    const areas = await readAreas({ allowFallback: false });

    if (areas.some((area) => area.owner === adminOwner && (area.id === payload.id || area.slug === payload.slug))) {
      return NextResponse.json({ error: "Area with this ID or slug already exists" }, { status: 409 });
    }

    const savedArea = await upsertSingleArea(payload, adminOwner);
    const verifiedAreas = await readAreas({ allowFallback: false });
    const verifiedArea = verifiedAreas.find((area) => area.owner === adminOwner && area.id === payload.id);

    if (!verifiedArea) {
      throw new Error(`Supabase verification failed: area ${payload.id} is not available after insert.`);
    }

    revalidateAreaPaths(adminOwner, payload.slug);

    return NextResponse.json(savedArea);
  } catch (error) {
    console.error("[api/areas:POST]", error);
    return NextResponse.json({ error: error.message || "Could not save area to Supabase." }, { status: 500 });
  }
}

export async function PUT(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const payload = normalizeArea({ ...(await request.json()), owner: adminOwner }, adminOwner);
    const areas = await readAreas({ allowFallback: false });
    const existing = areas.find((area) => area.owner === adminOwner && (area.id === payload.id || area.slug === payload.slug));

    if (!existing) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

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

    return NextResponse.json(savedArea);
  } catch (error) {
    console.error("[api/areas:PUT]", error);
    return NextResponse.json({ error: error.message || "Could not update area in Supabase." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const areas = await readAreas({ allowFallback: false });
    const removedArea = areas.find((area) => area.owner === adminOwner && (area.id === id || area.slug === id));

    if (!removedArea) {
      return NextResponse.json({ error: "Area not found" }, { status: 404 });
    }

    await deleteSingleArea(removedArea.id);
    revalidateAreaPaths(adminOwner, removedArea.slug || id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/areas:DELETE]", error);
    return NextResponse.json({ error: error.message || "Could not delete area from Supabase." }, { status: 500 });
  }
}
