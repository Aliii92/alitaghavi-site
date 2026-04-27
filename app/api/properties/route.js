import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth";
import { deleteSingleProperty, normalizeProperty, readProperties, upsertSingleProperty } from "../../../lib/properties";
import { hasSupabaseServerConfig } from "../../../lib/supabase-server";

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
  const inventoryType = searchParams.get("inventoryType") || "all";
  const adminOwner = ownerFromRequest(request);

  if (adminMode && !adminOwner) return forbidden();

  const owner = adminMode ? adminOwner : requestedOwner ? normalizeOwner(requestedOwner) : "";
  try {
    const properties = (
      await readProperties({
        allowFallback: !adminMode,
        inventoryType
      })
    ).map((property) => normalizeProperty(property, property.id));
    const scopedProperties = owner ? properties.filter((property) => property.owner === owner) : properties;

    return NextResponse.json(featuredOnly ? scopedProperties.filter((property) => property.featured) : scopedProperties);
  } catch (error) {
    console.error("[api/properties:GET]", error);
    return NextResponse.json({ error: error.message || "Could not fetch properties from Supabase." }, { status: 500 });
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
    const properties = await readProperties({ allowFallback: false });
    const property = normalizeProperty({ ...payload, owner: adminOwner }, `${payload.id || Date.now()}`);

    if (properties.some((item) => item.id === property.id)) {
      return NextResponse.json({ error: "A property with this ID already exists" }, { status: 409 });
    }

    const savedProperty = await upsertSingleProperty(property);
    const verifiedProperties = await readProperties({ allowFallback: false });
    const verifiedProperty = verifiedProperties.find((item) => item.id === property.id && item.owner === adminOwner);

    if (!verifiedProperty) {
      throw new Error(`Supabase verification failed: property ${property.id} is not available after insert.`);
    }

    revalidatePropertyPaths(adminOwner);

    return NextResponse.json(savedProperty, { status: 201 });
  } catch (error) {
    console.error("[api/properties:POST]", error);
    return NextResponse.json({ error: error.message || "Could not save property to Supabase." }, { status: 500 });
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

    const payload = await request.json();
    const properties = await readProperties({ allowFallback: false });
    const index = properties.findIndex((property) => property.id === payload.id && normalizeProperty(property, property.id).owner === adminOwner);

    if (index === -1) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const nextProperty = normalizeProperty({ ...properties[index], ...payload, owner: adminOwner }, properties[index].id);
    const savedProperty = await upsertSingleProperty(nextProperty);
    const verifiedProperties = await readProperties({ allowFallback: false });
    const verifiedProperty = verifiedProperties.find((item) => item.id === nextProperty.id && item.owner === adminOwner);

    if (!verifiedProperty) {
      throw new Error(`Supabase verification failed: property ${nextProperty.id} is not available after update.`);
    }

    revalidatePropertyPaths(adminOwner);

    return NextResponse.json(savedProperty);
  } catch (error) {
    console.error("[api/properties:PUT]", error);
    return NextResponse.json({ error: error.message || "Could not update property in Supabase." }, { status: 500 });
  }
}

export async function DELETE(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing property id" }, { status: 400 });
  }

  try {
    if (!hasSupabaseServerConfig()) {
      return NextResponse.json(
        { error: "Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const properties = await readProperties({ allowFallback: false });
    const existingProperty = properties.find(
      (property) => property.id === id && normalizeProperty(property, property.id).owner === adminOwner
    );

    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    await deleteSingleProperty(id, existingProperty);
    revalidatePropertyPaths(adminOwner);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/properties:DELETE]", error);
    return NextResponse.json({ error: error.message || "Could not delete property from Supabase." }, { status: 500 });
  }
}
