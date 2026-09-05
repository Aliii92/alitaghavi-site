import { readAreas } from "../lib/areas.js";
import { readProperties, isPubliclyVisibleProperty } from "../lib/properties.js";
export const dynamic = "force-dynamic";
export default async function sitemap() {
  const baseUrl = "https://www.alitaghavi.ae";
  const [areas, properties] = await Promise.all([readAreas(), readProperties()]);
  const routes = new Set(["", "/ready-properties", "/off-plan-projects", "/resale-off-plan", "/listings", "/blog",
    ...areas.filter(area=>area.active !== false).map(area=>`/prime-areas/${encodeURIComponent(area.slug)}`),
    ...properties.filter(isPubliclyVisibleProperty).map(property=>`/properties/${encodeURIComponent(property.id)}`)]);
  return [...routes].flatMap(route=>["en","fa"].map(locale=>({
    url: `${baseUrl}${locale === "fa" ? "/fa" : ""}${route}`,
    changeFrequency: "weekly", priority: route === "" ? 1 : 0.7,
    alternates: { languages: { en: `${baseUrl}${route}`, fa: `${baseUrl}/fa${route}` } }
  })));
}
