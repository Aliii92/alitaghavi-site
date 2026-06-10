import { readAreas } from "../lib/areas.js";

export default async function sitemap() {
  const baseUrl = "https://ali-taghavi.com";
  const areas = await readAreas();
  const staticRoutes = [
    "",
    "/ready-properties",
    "/off-plan-projects"
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: route === "" ? 1 : 0.8
    })),
    ...areas.map((area) => ({
      url: `${baseUrl}/prime-areas/${area.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7
    }))
  ];
}
