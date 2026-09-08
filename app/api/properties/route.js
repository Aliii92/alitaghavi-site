import { isPubliclyVisibleProperty } from "../../../lib/property-visibility";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { normalizeOwner, ownerFromRequest } from "../../../lib/adminAuth";
import { deleteSingleProperty, normalizeProperty, readProperties, upsertSingleProperty } from "../../../lib/properties";
import { hasSupabaseServerConfig } from "../../../lib/supabase-server";

function forbidden() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function success(payload = {}, status = 200) {
  return NextResponse.json({ success: true, ...payload }, { status });
}

function failure(error, status = 500) {
  return NextResponse.json({ success: false, error }, { status });
}

function logAction(action, details = {}) {
  console.log("[api/properties]", {
    table: details.table || "properties",
    action,
    owner: details.owner || "",
    inventoryType: details.inventoryType || "",
    payloadKeys: details.payload ? Object.keys(details.payload) : []
  });
}

function revalidatePropertyPaths() {
  const paths = ["/", "/ready-properties", "/listings", "/resale-off-plan", "/off-plan-projects"];
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

    return success({
      items: (featuredOnly ? scopedProperties.filter((property) => property.featured) : scopedProperties)
        .filter(property => adminMode || isPubliclyVisibleProperty(property))
        .map(property => { if (adminMode) return property; const { notes, ...publicProperty } = property; return publicProperty; })
    });
  } catch (error) {
    console.error("[api/properties:GET]", error);
    return failure(error.message || "Could not fetch properties from Supabase.", 500);
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
    const properties = await readProperties({ allowFallback: false });
    const property = normalizeProperty({ ...payload, owner: adminOwner }, `${payload.id || Date.now()}`);
    logAction("create", {
      owner: adminOwner,
      inventoryType: property.category,
      table: property.category === "resale-off-plan" ? "resale_off_plan" : "properties",
      payload
    });

    if (properties.some((item) => item.id === property.id)) {
      return failure("A property with this ID already exists", 409);
    }

    const savedProperty = await upsertSingleProperty(property);
    const verifiedProperties = await readProperties({ allowFallback: false });
    const verifiedProperty = verifiedProperties.find((item) => item.id === property.id && item.owner === adminOwner);

    if (!verifiedProperty) {
      throw new Error(`Supabase verification failed: property ${property.id} is not available after insert.`);
    }

    revalidatePropertyPaths(adminOwner);

    return success({ item: savedProperty }, 201);
  } catch (error) {
    console.error("[api/properties:POST]", error);
    return failure(error.message || "Could not save property to Supabase.", 500);
  }
}

export async function PUT(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const payload = await request.json();
    const properties = await readProperties({ allowFallback: false });
    const index = properties.findIndex((property) => property.id === payload.id && normalizeProperty(property, property.id).owner === adminOwner);
    logAction("update", {
      owner: adminOwner,
      inventoryType: payload.inventory_type || payload.category || "",
      table: payload.category === "resale-off-plan" || payload.inventory_type === "Resale Off-Plan" ? "resale_off_plan" : "properties",
      payload
    });

    if (index === -1) {
      return failure("Property not found", 404);
    }

    const nextProperty = normalizeProperty({ ...properties[index], ...payload, owner: adminOwner }, properties[index].id);
    const savedProperty = await upsertSingleProperty(nextProperty);
    const verifiedProperties = await readProperties({ allowFallback: false });
    const verifiedProperty = verifiedProperties.find((item) => item.id === nextProperty.id && item.owner === adminOwner);

    if (!verifiedProperty) {
      throw new Error(`Supabase verification failed: property ${nextProperty.id} is not available after update.`);
    }

    revalidatePropertyPaths(adminOwner);

    return success({ item: savedProperty });
  } catch (error) {
    console.error("[api/properties:PUT]", error);
    return failure(error.message || "Could not update property in Supabase.", 500);
  }
}

export async function DELETE(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) return forbidden();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return failure("Missing property id", 400);
  }

  try {
    if (!hasSupabaseServerConfig()) {
      return failure("Supabase server configuration is missing. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.", 500);
    }

    const properties = await readProperties({ allowFallback: false });
    const existingProperty = properties.find(
      (property) => property.id === id && normalizeProperty(property, property.id).owner === adminOwner
    );

    if (!existingProperty) {
      return failure("Property not found", 404);
    }

    logAction("delete", {
      owner: adminOwner,
      inventoryType: existingProperty.category,
      table: existingProperty.category === "resale-off-plan" ? "resale_off_plan" : "properties",
      payload: { id }
    });
    await deleteSingleProperty(id, existingProperty);
    revalidatePropertyPaths(adminOwner);

    return success({ item: { id } });
  } catch (error) {
    console.error("[api/properties:DELETE]", error);
    return failure(error.message || "Could not delete property from Supabase.", 500);
  }
}

