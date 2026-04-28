const placeholderSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#10273d" />
        <stop offset="100%" stop-color="#2c5b86" />
      </linearGradient>
    </defs>
    <rect width="1200" height="720" fill="url(#g)" />
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#f7f4ed" font-family="Georgia, serif" font-size="42">
      Luxury Property
    </text>
  </svg>
`)}`;

function normalizePath(raw) {
  const normalized = String(raw || "").trim();
  if (!normalized) return "";
  if (normalized.startsWith("/")) return normalized;
  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("data:")) {
    return normalized;
  }
  if (normalized.startsWith("public/uploads/")) {
    return `/${normalized.replace(/^public\//, "")}`;
  }
  if (normalized.startsWith("uploads/")) {
    return `/${normalized}`;
  }
  return normalized;
}

function firstFromCollection(value) {
  if (Array.isArray(value)) {
    return value.find((item) => String(item || "").trim()) || "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.find((item) => String(item || "").trim()) || "";
        }
      } catch {
        return "";
      }
    }
  }

  return "";
}

export function getImageSrc(item = {}, fallback = placeholderSvg) {
  const candidates = [
    item.image_url,
    item.image,
    item.imageUrl,
    item.main_image,
    item.mainImage,
    item.featured_image,
    item.featuredImage,
    item.cover_image,
    item.coverImage,
    item.thumbnail,
    item.photo,
    firstFromCollection(item.images),
    firstFromCollection(item.photos),
    firstFromCollection(item.gallery)
  ];

  for (const candidate of candidates) {
    const src = normalizePath(candidate);
    if (src) return src;
  }

  return fallback;
}

export function getPropertyImage(property = {}, fallback = "/images/property-placeholder.jpg") {
  return getImageSrc(property, fallback);
}

export function getImagePlaceholder() {
  return placeholderSvg;
}
