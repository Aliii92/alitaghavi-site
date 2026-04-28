import {
  isReadyProperty,
  isPubliclyVisibleProperty,
  normalizeAreaSlug,
  readProperties
} from "./properties.js";
import { hasSupabaseServerConfig, supabaseSelect } from "./supabase-server.js";

const primaryAreaFallbacks = {
  "palm-jumeirah": "Palm Jumeirah",
  downtown: "Downtown",
  bluewaters: "Bluewaters",
  meydan: "Meydan"
};

export function areaNameFromSlug(areaSlug) {
  const slug = normalizeAreaSlug(areaSlug);
  if (!slug) return "";
  if (primaryAreaFallbacks[slug]) return primaryAreaFallbacks[slug];

  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function readDynamicAreaNames() {
  try {
    if (hasSupabaseServerConfig()) {
      const rows = await supabaseSelect("properties", { select: "area", order: "area.asc" });
      const names = [...new Set(
        (Array.isArray(rows) ? rows : [])
          .map((row) => String(row?.area || "").trim())
          .filter(Boolean)
      )];
      return names;
    }
  } catch (error) {
    console.error("[readDynamicAreaNames] Supabase fetch failed:", error);
  }

  const properties = await readProperties({ allowFallback: true, inventoryType: "ready" });
  return [...new Set(
    (Array.isArray(properties) ? properties : [])
      .filter((property) => isPubliclyVisibleProperty(property) && isReadyProperty(property))
      .map((property) => String(property?.area || "").trim())
      .filter(Boolean)
  )];
}
