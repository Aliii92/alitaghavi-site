import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { normalizeArea, readAreas, writeAreas } from "../../../lib/areas.js";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth.js";

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

  const owner = adminMode ? adminOwner : requestedOwner ? normalizeOwner(requestedOwner) : "";
  const areas = await readAreas();
  return NextResponse.json(owner ? areas.filter((area) => area.owner === owner) : areas);
}

export async function POST(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const payload = normalizeArea({ ...(await request.json()), owner: adminOwner }, adminOwner);
  const areas = await readAreas();

  if (areas.some((area) => area.owner === adminOwner && (area.id === payload.id || area.slug === payload.slug))) {
    return NextResponse.json({ error: "Area with this ID or slug already exists" }, { status: 409 });
  }

  areas.push(payload);
  await writeAreas(areas);
  revalidateAreaPaths(adminOwner, payload.slug);

  return NextResponse.json(payload);
}

export async function PUT(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const payload = normalizeArea({ ...(await request.json()), owner: adminOwner }, adminOwner);
  const areas = await readAreas();
  const index = areas.findIndex((area) => area.owner === adminOwner && (area.id === payload.id || area.slug === payload.slug));

  if (index === -1) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  areas[index] = normalizeArea({ ...areas[index], ...payload, owner: adminOwner }, adminOwner);
  await writeAreas(areas);
  revalidateAreaPaths(adminOwner, areas[index].slug);

  return NextResponse.json(areas[index]);
}

export async function DELETE(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const areas = await readAreas();
  const removedArea = areas.find((area) => area.owner === adminOwner && (area.id === id || area.slug === id));
  const nextAreas = areas.filter((area) => !(area.owner === adminOwner && (area.id === id || area.slug === id)));

  if (nextAreas.length === areas.length) {
    return NextResponse.json({ error: "Area not found" }, { status: 404 });
  }

  await writeAreas(nextAreas);
  revalidateAreaPaths(adminOwner, removedArea?.slug || id);
  return NextResponse.json({ ok: true });
}
