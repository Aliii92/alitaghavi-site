export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/fa/admin", "/api"]
    },
    sitemap: "https://www.alitaghavi.ae/sitemap.xml"
  };
}


