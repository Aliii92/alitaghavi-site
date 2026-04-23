export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"]
    },
    sitemap: "https://ali-taghavi.com/sitemap.xml"
  };
}

