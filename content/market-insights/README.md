# Approved Market Insights

This folder is the write bridge for approved weekly Market Insights articles.

## Publication path

1. ChatGPT prepares the bilingual draft and asks Ali for explicit approval.
2. After Ali explicitly approves that exact draft, ChatGPT creates one JSON file here:
   `content/market-insights/<slug>.json`.
3. The file must contain `"approved": true`, `"status": "published"`, and a fixed ISO `published_at`.
4. Vercel runs `scripts/sync-approved-market-insights.mjs` before the Next.js build.
5. The production Vercel environment upserts the approved article into Supabase `public.blog_posts` using the existing server-side service-role credential.
6. The website continues reading articles from Supabase.

No Supabase secret belongs in GitHub content files, ChatGPT prompts, or article text.

## JSON shape

```json
{
  "approved": true,
  "title_en": "English title",
  "title_fa": "عنوان فارسی",
  "slug": "english-kebab-case-slug",
  "excerpt_en": "English excerpt",
  "excerpt_fa": "خلاصه فارسی",
  "content_en": "<p>Approved English body...</p>",
  "content_fa": "<p>متن فارسی تأییدشده...</p>",
  "cover_image_url": "/images/blog/example.jpg",
  "category": "Market Insights",
  "author": "Ali Taghavi",
  "status": "published",
  "published_at": "2026-09-28T08:00:00.000Z"
}
```

Only the exact user-approved article may be committed with `approved: true`.
