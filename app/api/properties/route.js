import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth";
import { normalizeProperty, readProperties, writeProperties } from "../../../lib/properties";

function forbidden() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function revalidatePropertyPaths(owner) {
  const paths = owner === "negin"
    ? ["/negin", "/negin/ready-properties", "/negin/listings", "/negin/resale-off-plan", "/negin/off-plan"]
    : ["/", "/ready-properties", "/listings", "/resale-off-plan", "/off-plan-projects"];
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
  const properties = (await readProperties()).map((property) => normalizeProperty(property, property.id));
  const scopedProperties = owner ? properties.filter((property) => property.owner === owner) : properties;

  return NextResponse.json(featuredOnly ? scopedProperties.filter((property) => property.featured) : scopedProperties);
}

export async function POST(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const payload = await request.json();
  const properties = await readProperties();
  const property = normalizeProperty({ ...payload, owner: adminOwner }, `${payload.id || Date.now()}`);

  if (properties.some((item) => item.id === property.id)) {
    return NextResponse.json({ error: "A property with this ID already exists" }, { status: 409 });
  }

  properties.push(property);
  await writeProperties(properties);
  revalidatePropertyPaths(adminOwner);

  return NextResponse.json(property, { status: 201 });
}

export async function PUT(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const payload = await request.json();
  const properties = await readProperties();
  const index = properties.findIndex((property) => property.id === payload.id && normalizeProperty(property, property.id).owner === adminOwner);

  if (index === -1) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  properties[index] = normalizeProperty({ ...properties[index], ...payload, owner: adminOwner }, properties[index].id);
  await writeProperties(properties);
  revalidatePropertyPaths(adminOwner);

  return NextResponse.json(properties[index]);
}

export async function DELETE(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing property id" }, { status: 400 });
  }

  const properties = await readProperties();
  const nextProperties = properties.filter(
    (property) => !(property.id === id && normalizeProperty(property, property.id).owner === adminOwner)
  );

  if (nextProperties.length === properties.length) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  await writeProperties(nextProperties);
  revalidatePropertyPaths(adminOwner);

  return NextResponse.json({ ok: true });
}
