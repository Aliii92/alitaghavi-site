import ResponsiveNavbar from "../../../components/ResponsiveNavbar";
import { BLOG_PLACEHOLDER, getBlogPostBySlug, getBlogSlugs } from "../../../lib/blog";
import { localizePath } from "../../../lib/locale";
import { getRequestLocale } from "../../../lib/server-locale";

export async function generateStaticParams() {
  return (await getBlogSlugs({ publishedOnly: true })).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const locale = await getRequestLocale();
  const { slug } = await params;
  console.log("[blog-detail:metadata] slug:", slug);

  const post = await getBlogPostBySlug(slug, locale, { publishedOnly: true });
  console.log("[blog-detail:metadata] returned post object:", post);

  if (!post) {
    return {
      title: "Article not found"
    };
  }

  return {
    title: post.title || "Market Insights",
    description: post.excerpt || "Market insights article",
    alternates: {
      canonical: `/blog/${post.slug}`
    },
    openGraph: {
      title: post.title || "Market Insights",
      description: post.excerpt || "Market insights article",
      url: `/blog/${post.slug}`,
      images: [
        {
          url: post.coverImage || BLOG_PLACEHOLDER,
          alt: post.title || "Market Insights"
        }
      ]
    }
  };
}

function formatBlogDate(date, locale = "en") {
  const parsed = date ? new Date(date) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return "";

  const normalizedLocale = locale === "fa" ? "fa-IR" : "en-GB";
  return new Intl.DateTimeFormat(normalizedLocale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(parsed);
}

function navLinks(locale = "en") {
  const copy = locale === "fa"
    ? {
        ready: "املاک آماده",
        offPlan: "پروژه‌های آف‌پلن",
        resale: "ریسل آف‌پلن",
        blog: "تحلیل بازار",
        areas: "مناطق برتر",
        switch: "نگین محمدی",
        contact: "ارتباط",
        about: "درباره من"
      }
    : {
        ready: "Ready Properties",
        offPlan: "Off-Plan Projects",
        resale: "Resale Off-Plan",
        blog: "Market Insights",
        areas: "Prime Areas",
        switch: "Negin Mohamadi",
        contact: "Contact",
        about: "About Me"
      };

  return [
    { href: localizePath("/ready-properties", locale), label: copy.ready },
    { href: localizePath("/off-plan-projects", locale), label: copy.offPlan },
    { href: localizePath("/resale-off-plan", locale), label: copy.resale },
    { href: localizePath("/blog", locale), label: copy.blog },
    { href: localizePath("/#areas", locale), label: copy.areas },
    { href: localizePath("/negin", locale), label: copy.switch },
    { href: localizePath("/#contact", locale), label: copy.contact },
    { href: localizePath("/#advisory", locale), label: copy.about }
  ];
}

function renderArticleNotFound(locale = "en") {
  const copy = locale === "fa"
    ? {
        brand: "املاک لوکس دبی",
        eyebrow: "تحلیل بازار",
        title: "مقاله پیدا نشد",
        text: "این مقاله در حال حاضر در دسترس نیست یا هنوز منتشر نشده است.",
        back: "بازگشت به همه مقاله‌ها"
      }
    : {
        brand: "Dubai Luxury Properties",
        eyebrow: "Market Insights",
        title: "Article not found",
        text: "This article is not available right now or has not been published yet.",
        back: "Back to all articles"
      };

  return (
    <main className="luxury-page listings-page">
      <ResponsiveNavbar
        brandLabel={copy.brand}
        brandHref={localizePath("/", locale)}
        links={navLinks(locale)}
        locale={locale}
      />

      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p className="section-text">{copy.text}</p>
            <a className="back-to-listings-link" href={localizePath("/blog", locale)}>
              {copy.back}
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function looksLikeHtml(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value || ""));
}

export default async function BlogArticlePage({ params }) {
  const locale = await getRequestLocale();
  const { slug } = await params;
  console.log("[blog-detail:page] slug:", slug);

  const post = await getBlogPostBySlug(slug, locale, { publishedOnly: true });
  console.log("[blog-detail:page] returned post object:", post);

  if (!post) return renderArticleNotFound(locale);

  const copy = locale === "fa"
    ? {
        brand: "املاک لوکس دبی",
        eyebrow: "تحلیل بازار",
        back: "بازگشت به همه مقاله‌ها",
        emptyContent: "محتوای این مقاله هنوز اضافه نشده است."
      }
    : {
        brand: "Dubai Luxury Properties",
        eyebrow: "Market Insights",
        back: "Back to all articles",
        emptyContent: "This article does not have content yet."
      };

  const content = String(post.content || "");
  const paragraphs = content
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const hasHtmlContent = looksLikeHtml(content);
  const formattedDate = formatBlogDate(post.date, locale);

  return (
    <main className="luxury-page listings-page">
      <ResponsiveNavbar
        brandLabel={copy.brand}
        brandHref={localizePath("/", locale)}
        links={navLinks(locale)}
        locale={locale}
      />

      <div className="content-shell listings-page-shell">
        <section className="section listings-intro-section">
          <div className="section-header centered listings-page-header">
            <p className="section-eyebrow">{copy.eyebrow}</p>
            <h1>{post.title || "Market Insights"}</h1>
            {post.excerpt ? <p className="section-text">{post.excerpt}</p> : null}
            <a className="back-to-listings-link" href={localizePath("/blog", locale)}>
              {copy.back}
            </a>
          </div>
        </section>

        <article className="blog-article-card">
          <img
            className="blog-article-image"
            src={post.coverImage || BLOG_PLACEHOLDER}
            alt={post.title || "Market Insights"}
            loading="lazy"
          />
          <div className="blog-article-body" dir={locale === "fa" ? "rtl" : "ltr"}>
            <div className="blog-meta-line blog-article-meta">
              {post.category ? <span>{post.category}</span> : null}
              {formattedDate ? <span>{formattedDate}</span> : null}
              {post.author ? <span>{post.author}</span> : null}
            </div>
            {hasHtmlContent ? (
              <div
                className="blog-rich-content"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : (
              <div className="blog-rich-content">
                {paragraphs.length ? paragraphs.map((paragraph, index) => (
                  <p key={`${post.slug}-${index}`}>{paragraph}</p>
                )) : <p>{copy.emptyContent}</p>}
              </div>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}
