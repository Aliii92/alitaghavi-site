import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content", "market-insights");
const ALLOWED_FIELDS = [
  "title_en",
  "title_fa",
  "slug",
  "excerpt_en",
  "excerpt_fa",
  "content_en",
  "content_fa",
  "cover_image_url",
  "category",
  "author",
  "status",
  "published_at"
];

function normalizeBaseUrl(value = "") {
  return String(value || "").replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
}

function requiredString(article, key) {
  const value = String(article?.[key] ?? "").trim();
  if (!value) throw new Error(`Missing required field "${key}" in ${article?.slug || "article"}`);
  return value;
}

function validateArticle(article, filename) {
  if (!article || typeof article !== "object" || Array.isArray(article)) {
    throw new Error(`Invalid article JSON: ${filename}`);
  }

  if (article.approved !== true || article.status !== "published") return null;

  const slug = requiredString(article, "slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid slug in ${filename}: ${slug}`);
  }

  for (const key of ["title_en", "title_fa", "excerpt_en", "excerpt_fa", "content_en", "content_fa", "published_at"]) {
    requiredString(article, key);
  }

  const publishedAt = new Date(article.published_at);
  if (Number.isNaN(publishedAt.getTime())) {
    throw new Error(`Invalid published_at in ${filename}`);
  }

  const combinedHtml = [article.content_en, article.content_fa].join("\n");
  if (/<script\b|<iframe\b|\son\w+\s*=|javascript:/i.test(combinedHtml)) {
    throw new Error(`Unsafe HTML rejected in ${filename}`);
  }

  const payload = {};
  for (const key of ALLOWED_FIELDS) {
    if (article[key] !== undefined) payload[key] = article[key];
  }

  payload.slug = slug;
  payload.author = String(payload.author || "Ali Taghavi").trim();
  payload.category = String(payload.category || "Market Insights").trim();
  payload.status = "published";
  payload.published_at = publishedAt.toISOString();
  payload.cover_image_url = String(payload.cover_image_url || "").trim() || null;

  return payload;
}

async function readApprovedArticles() {
  let names = [];
  try {
    names = await readdir(CONTENT_DIR);
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }

  const articles = [];
  for (const name of names.filter((name) => name.endsWith(".json")).sort()) {
    const fullPath = path.join(CONTENT_DIR, name);
    const article = JSON.parse(await readFile(fullPath, "utf8"));
    const payload = validateArticle(article, name);
    if (payload) articles.push(payload);
  }
  return articles;
}

async function main() {
  const articles = await readApprovedArticles();
  if (!articles.length) {
    console.log("[market-insights-sync] No approved article files to publish.");
    return;
  }

  const url = normalizeBaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // A secondary/preview Vercel project may intentionally not have website Supabase envs.
  // Skip there; the production project with the configured env performs the sync.
  if (!url || !serviceRoleKey) {
    console.log("[market-insights-sync] Supabase production env is unavailable; skipping content sync.");
    return;
  }

  for (const article of articles) {
    const endpoint = `${url}/rest/v1/blog_posts?on_conflict=slug`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify([article])
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Failed to publish ${article.slug}: HTTP ${response.status} ${text}`);
    }

    let saved = [];
    try {
      saved = text ? JSON.parse(text) : [];
    } catch {
      saved = [];
    }

    if (!Array.isArray(saved) || !saved.some((row) => row.slug === article.slug && row.status === "published")) {
      throw new Error(`Supabase did not confirm published article: ${article.slug}`);
    }

    console.log(`[market-insights-sync] Published: ${article.slug}`);
  }
}

main().catch((error) => {
  console.error("[market-insights-sync]", error?.message || error);
  process.exit(1);
});
