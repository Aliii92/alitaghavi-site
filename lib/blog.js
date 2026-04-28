import {
  hasSupabaseServerConfig,
  supabaseDelete,
  supabaseInsert,
  supabaseSelect,
  supabaseUpsert
} from "./supabase-server.js";

const BLOG_TABLE = "blog_posts";
const BLOG_PLACEHOLDER = "/images/blog/blog-placeholder.jpg";
const BLOG_SELECT_COLUMNS = [
  "id",
  "slug",
  "title_en",
  "title_fa",
  "excerpt_en",
  "excerpt_fa",
  "content_en",
  "content_fa",
  "cover_image_url",
  "category",
  "author",
  "status",
  "published_at",
  "created_at",
  "updated_at"
].join(",");

const fallbackBlogPosts = [
  {
    id: "why-dubai-luxury-demand-keeps-growing",
    slug: "why-dubai-luxury-demand-keeps-growing",
    title_en: "Why Dubai Luxury Demand Keeps Growing",
    title_fa: "چرا تقاضا برای املاک لوکس دبی همچنان در حال رشد است",
    excerpt_en:
      "A concise look at why global capital, lifestyle migration, and branded inventory continue to strengthen Dubai's prime residential market.",
    excerpt_fa:
      "مروری کوتاه بر اینکه چرا سرمایه جهانی، مهاجرت سبک زندگی و موجودی برندد همچنان بازار مسکونی پرایم دبی را تقویت می‌کنند.",
    content_en: `Dubai's prime market continues to benefit from a combination of global wealth migration, tax efficiency, and a lifestyle offering that is difficult to replicate elsewhere in the region.

For many buyers, the appeal is no longer only about short-term upside. The city now offers long-term residency pathways, globally recognizable brands, and a deeper pool of ready and off-plan inventory across waterfront and central districts.

The strongest demand still clusters around locations that combine prestige, convenience, and a limited supply dynamic. Palm Jumeirah, Downtown, and select branded beachfront communities continue to stand out because they satisfy both lifestyle users and investors at the same time.

For serious buyers, the key is not simply finding a popular property. It is identifying which buildings, unit types, and positions are likely to remain liquid and desirable through different market cycles.`,
    content_fa: `بازار پرایم دبی همچنان از ترکیب مهاجرت سرمایه جهانی، مزیت‌های مالیاتی و سبک زندگی‌ای بهره می‌برد که در بسیاری از بازارهای منطقه به‌سادگی قابل تکرار نیست.

برای بسیاری از خریداران، جذابیت دبی دیگر فقط به رشد کوتاه‌مدت محدود نمی‌شود. این شهر اکنون مسیرهای اقامت بلندمدت، برندهای شناخته‌شده جهانی و موجودی عمیق‌تری از املاک آماده و آف‌پلن را در مناطق مرکزی و واترفرانت ارائه می‌دهد.

بیشترین تقاضا همچنان در لوکیشن‌هایی متمرکز است که پرستیژ، دسترسی مناسب و محدودیت نسبی عرضه را هم‌زمان دارند. پالم جمیرا، داون‌تاون و برخی کامیونیتی‌های برندد ساحلی همچنان برجسته هستند، چون هم برای مصرف‌کننده نهایی و هم برای سرمایه‌گذار جذاب‌اند.

برای خریداران جدی، نکته اصلی فقط پیدا کردن یک ملک محبوب نیست؛ بلکه باید تشخیص داد کدام ساختمان‌ها، تیپ واحدها و موقعیت‌ها در چرخه‌های مختلف بازار همچنان نقدشوندگی و جذابیت خود را حفظ می‌کنند.`,
    cover_image_url: "/dubai-hero.png",
    category: "Market Trends",
    author: "Ali Taghavi",
    status: "published",
    published_at: "2026-04-20"
  },
  {
    id: "ready-vs-off-plan-how-to-think-like-an-investor",
    slug: "ready-vs-off-plan-how-to-think-like-an-investor",
    title_en: "Ready vs Off-Plan: How To Think Like an Investor",
    title_fa: "آماده یا آف‌پلن: چگونه مثل یک سرمایه‌گذار فکر کنیم",
    excerpt_en:
      "A practical framework for deciding when ready inventory makes more sense than off-plan and where each strategy fits in a disciplined portfolio.",
    excerpt_fa:
      "یک چارچوب کاربردی برای تصمیم‌گیری درباره اینکه چه زمانی ملک آماده منطقی‌تر از آف‌پلن است و هر استراتژی در چه جایگاهی از یک پرتفوی منظم قرار می‌گیرد.",
    content_en: `Ready property and off-plan property serve different objectives, and many buying mistakes happen when investors mix those objectives together.

Ready inventory is usually more useful when the buyer needs clarity on what exists today. You can inspect the asset, review the exact building quality, evaluate rental evidence, and make a cleaner decision on livability or immediate income.

Off-plan becomes more compelling when the buyer is intentionally targeting future positioning, staged payment plans, and access to product that may be difficult to source once delivered. In those cases, developer quality, handover credibility, and future competition become critical.

The best strategy often depends on your time horizon, your need for cash flow, and whether your priority is certainty, upside, or optionality.`,
    content_fa: `ملک آماده و ملک آف‌پلن هرکدام برای هدف متفاوتی مناسب‌اند و بسیاری از اشتباهات سرمایه‌گذاری زمانی رخ می‌دهد که این اهداف با هم اشتباه گرفته شوند.

موجودی آماده معمولاً زمانی مفیدتر است که خریدار به شفافیت درباره دارایی امروز نیاز دارد. می‌توان ملک را دید، کیفیت واقعی ساختمان را سنجید، شواهد اجاره را بررسی کرد و تصمیم روشن‌تری درباره سکونت یا درآمد فوری گرفت.

آف‌پلن زمانی جذاب‌تر می‌شود که خریدار عمداً به‌دنبال موقعیت‌گیری آینده، پلن پرداخت مرحله‌ای و دسترسی به محصولی باشد که پس از تحویل سخت‌تر پیدا می‌شود. در این حالت، کیفیت توسعه‌دهنده، اعتبار زمان تحویل و سطح رقابت آینده اهمیت کلیدی دارند.

بهترین استراتژی معمولاً به افق زمانی، نیاز شما به جریان نقدی و این بستگی دارد که اولویت شما قطعیت، رشد یا اختیار عمل بیشتر باشد.`,
    cover_image_url: "/uploads/area-palm-jumeirah-1776780044675.png",
    category: "Investment Strategy",
    author: "Ali Taghavi",
    status: "published",
    published_at: "2026-04-14"
  },
  {
    id: "how-to-evaluate-a-prime-area-beyond-the-headline",
    slug: "how-to-evaluate-a-prime-area-beyond-the-headline",
    title_en: "How To Evaluate a Prime Area Beyond the Headline",
    title_fa: "چطور یک منطقه پرایم را فراتر از ظاهر اولیه ارزیابی کنیم",
    excerpt_en:
      "Prestige matters, but buyers should also look at supply profile, building quality, tenant depth, and resale liquidity before committing.",
    excerpt_fa:
      "پرستیژ مهم است، اما خریداران باید قبل از تصمیم نهایی به پروفایل عرضه، کیفیت ساختمان، عمق تقاضای اجاره و نقدشوندگی ریسیل هم توجه کنند.",
    content_en: `Many buyers begin with a famous area name, but strong decision-making usually happens one layer deeper.

Within the same prime district, buildings can behave very differently. Some hold value because of superior layouts, management standards, or unit scarcity. Others underperform simply because too much similar stock competes at the same time.

That is why area analysis should include both macro and micro views. The macro side looks at location prestige, accessibility, and long-term demand. The micro side looks at the exact building, the unit line, the view, and the comparable stock buyers will be choosing from.

The objective is not only to buy in the right area. It is to buy the right asset within the right area.`,
    content_fa: `بسیاری از خریداران با نام یک منطقه مشهور شروع می‌کنند، اما تصمیم‌گیری قوی معمولاً در یک لایه عمیق‌تر شکل می‌گیرد.

در یک منطقه پرایم واحد، ساختمان‌ها می‌توانند رفتار بسیار متفاوتی داشته باشند. بعضی به‌دلیل پلان بهتر، کیفیت مدیریت یا کمیابی واحدها ارزش خود را بهتر حفظ می‌کنند. بعضی دیگر صرفاً به این دلیل ضعیف‌تر عمل می‌کنند که موجودی مشابه زیادی هم‌زمان با آن‌ها رقابت می‌کند.

به همین دلیل، تحلیل منطقه باید هم دید کلان و هم دید خرد داشته باشد. در سطح کلان باید به پرستیژ لوکیشن، دسترسی و تقاضای بلندمدت نگاه کرد. در سطح خرد باید ساختمان مشخص، تیپ واحد، ویو و موجودی comparable را بررسی کرد.

هدف فقط خرید در منطقه درست نیست؛ هدف خرید دارایی درست در داخل منطقه درست است.`,
    cover_image_url: "/uploads/area-downtown-1776779379475.png",
    category: "Area Analysis",
    author: "Ali Taghavi",
    status: "published",
    published_at: "2026-04-07"
  }
];

function normalizeLocale(locale = "en") {
  return locale === "fa" ? "fa" : "en";
}

function safeString(value) {
  return String(value || "").trim();
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(safeString(value));
}

function ensureIsoDate(value) {
  const source = safeString(value);
  if (!source) return "";
  const parsed = new Date(source);
  return Number.isNaN(parsed.getTime()) ? source : parsed.toISOString();
}

function dateOnly(value) {
  const iso = ensureIsoDate(value);
  return iso ? iso.slice(0, 10) : "";
}

function localizePost(post, locale = "en") {
  const normalizedLocale = normalizeLocale(locale);
  return {
    id: safeString(post.id || post.slug),
    slug: safeString(post.slug),
    title: normalizedLocale === "fa" ? safeString(post.title_fa || post.title_en) : safeString(post.title_en || post.title_fa),
    excerpt: normalizedLocale === "fa" ? safeString(post.excerpt_fa || post.excerpt_en) : safeString(post.excerpt_en || post.excerpt_fa),
    content: normalizedLocale === "fa" ? safeString(post.content_fa || post.content_en) : safeString(post.content_en || post.content_fa),
    coverImage: safeString(post.cover_image_url) || BLOG_PLACEHOLDER,
    date: dateOnly(post.published_at || post.created_at || post.updated_at),
    author: safeString(post.author) || "Ali Taghavi",
    category: safeString(post.category) || "Market Insights",
    status: safeString(post.status || "draft").toLowerCase()
  };
}

function normalizeBlogPost(record = {}) {
  const slug = safeString(record.slug);
  const titleEn = safeString(record.title_en);
  return {
    id: safeString(record.id),
    title_en: titleEn,
    title_fa: safeString(record.title_fa),
    slug,
    excerpt_en: safeString(record.excerpt_en),
    excerpt_fa: safeString(record.excerpt_fa),
    content_en: safeString(record.content_en),
    content_fa: safeString(record.content_fa),
    cover_image_url: safeString(record.cover_image_url),
    category: safeString(record.category),
    author: safeString(record.author || "Ali Taghavi"),
    status: ["draft", "published"].includes(safeString(record.status).toLowerCase()) ? safeString(record.status).toLowerCase() : "draft",
    published_at: record.published_at ? ensureIsoDate(record.published_at) : null,
    created_at: record.created_at ? ensureIsoDate(record.created_at) : null,
    updated_at: record.updated_at ? ensureIsoDate(record.updated_at) : null
  };
}

function sanitizeBlogPayload(record = {}, { includeId = false } = {}) {
  const normalized = normalizeBlogPost(record);
  const payload = {
    title_en: normalized.title_en,
    title_fa: normalized.title_fa,
    slug: normalized.slug,
    excerpt_en: normalized.excerpt_en,
    excerpt_fa: normalized.excerpt_fa,
    content_en: normalized.content_en,
    content_fa: normalized.content_fa,
    cover_image_url: normalized.cover_image_url || null,
    category: normalized.category || null,
    author: normalized.author || null,
    status: normalized.status,
    published_at: normalized.status === "published" ? (normalized.published_at || new Date().toISOString()) : null
  };

  if (includeId && isValidUuid(normalized.id)) {
    payload.id = normalized.id;
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

async function readSupabaseBlogPosts() {
  const rows = await supabaseSelect(BLOG_TABLE, { order: "published_at.desc.nullslast,created_at.desc.nullslast" });
  return Array.isArray(rows) ? rows.map(normalizeBlogPost) : [];
}

async function readSupabaseBlogPostBySlug(slug, { publishedOnly = true } = {}) {
  console.log("[blog-detail] slug:", slug);

  const rows = await supabaseSelect(BLOG_TABLE, {
    select: BLOG_SELECT_COLUMNS,
    slug: `eq.${safeString(slug)}`,
    ...(publishedOnly ? { status: "eq.published" } : {}),
    limit: 1
  });

  const post = Array.isArray(rows) && rows.length ? normalizeBlogPost(rows[0]) : null;
  console.log("[blog-detail] returned post object:", post);
  return post;
}

function readFallbackBlogPosts() {
  return fallbackBlogPosts.map(normalizeBlogPost);
}

export async function readBlogPosts({ allowFallback = true, publishedOnly = false } = {}) {
  try {
    if (!hasSupabaseServerConfig()) {
      if (!allowFallback) {
        throw new Error("Supabase server configuration is missing for blog posts.");
      }
      return readFallbackBlogPosts().filter((post) => !publishedOnly || post.status === "published");
    }

    const posts = await readSupabaseBlogPosts();
    return posts.filter((post) => !publishedOnly || post.status === "published");
  } catch (error) {
    console.error("[readBlogPosts] Supabase fetch failed:", error);
    if (!allowFallback) throw error;
    console.warn("[readBlogPosts] Falling back to local blog posts:", error?.message || error);
    return readFallbackBlogPosts().filter((post) => !publishedOnly || post.status === "published");
  }
}

export async function getAllBlogPosts(locale = "en", options = {}) {
  const posts = await readBlogPosts({ allowFallback: true, publishedOnly: options.publishedOnly !== false });
  return posts.map((post) => localizePost(post, locale));
}

export async function getBlogPostBySlug(slug, locale = "en", options = {}) {
  const publishedOnly = options.publishedOnly !== false;
  const allowFallback = options.allowFallback !== false;

  try {
    if (!hasSupabaseServerConfig()) {
      if (!allowFallback) {
        throw new Error("Supabase server configuration is missing for blog posts.");
      }
      const fallbackPost = readFallbackBlogPosts().find(
        (item) => item.slug === slug && (!publishedOnly || item.status === "published")
      );
      console.log("[blog-detail] returned post object:", fallbackPost || null);
      return fallbackPost ? localizePost(fallbackPost, locale) : null;
    }

    const post = await readSupabaseBlogPostBySlug(slug, { publishedOnly });
    return post ? localizePost(post, locale) : null;
  } catch (error) {
    console.error("[blog-detail] Supabase query error:", error);
    if (!allowFallback) return null;
    const fallbackPost = readFallbackBlogPosts().find(
      (item) => item.slug === slug && (!publishedOnly || item.status === "published")
    );
    console.log("[blog-detail] returned post object:", fallbackPost || null);
    return fallbackPost ? localizePost(fallbackPost, locale) : null;
  }
}

export async function getBlogSlugs(options = {}) {
  const posts = await readBlogPosts({ allowFallback: true, publishedOnly: options.publishedOnly !== false });
  return posts.map((post) => post.slug).filter(Boolean);
}

export async function createSingleBlogPost(record) {
  const payload = sanitizeBlogPayload(record, { includeId: false });
  console.log("[blog] create payload keys:", Object.keys(payload));
  const [saved] = await supabaseInsert(BLOG_TABLE, [payload]);
  return normalizeBlogPost(saved || payload);
}

export async function updateSingleBlogPost(record) {
  const payload = sanitizeBlogPayload(record, { includeId: true });
  if (!isValidUuid(payload.id)) {
    throw new Error("A valid blog post UUID is required for updates.");
  }

  console.log("[blog] update payload keys:", Object.keys(payload));
  const [saved] = await supabaseUpsert(BLOG_TABLE, [payload], "id");
  return normalizeBlogPost(saved || payload);
}

export async function deleteSingleBlogPost(id) {
  await supabaseDelete(BLOG_TABLE, { id: `eq.${encodeURIComponent(id)}` });
}

export { BLOG_PLACEHOLDER, BLOG_TABLE, isValidUuid, normalizeBlogPost, sanitizeBlogPayload };
