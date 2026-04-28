import { notFound } from "next/navigation";
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
  const post = await getBlogPostBySlug(slug, locale, { publishedOnly: true });

  if (!post) {
    return {
      title: "Article not found"
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      images: [
        {
          url: post.coverImage,
          alt: post.title
        }
      ]
    }
  };
}

function formatBlogDate(date, locale = "en") {
  const normalizedLocale = locale === "fa" ? "fa-IR" : "en-GB";
  return new Intl.DateTimeFormat(normalizedLocale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
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

export default async function BlogArticlePage({ params }) {
  const locale = await getRequestLocale();
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug, locale, { publishedOnly: true });

  if (!post) notFound();

  const copy = locale === "fa"
    ? {
        brand: "املاک لوکس دبی",
        eyebrow: "تحلیل بازار",
        back: "بازگشت به همه مقاله‌ها"
      }
    : {
        brand: "Dubai Luxury Properties",
        eyebrow: "Market Insights",
        back: "Back to all articles"
      };

  const paragraphs = String(post.content || "")
    .split(/\n\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

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
            <h1>{post.title}</h1>
            <p className="section-text">{post.excerpt}</p>
            <a className="back-to-listings-link" href={localizePath("/blog", locale)}>
              {copy.back}
            </a>
          </div>
        </section>

        <article className="blog-article-card">
          <img className="blog-article-image" src={post.coverImage || BLOG_PLACEHOLDER} alt={post.title} loading="lazy" />
          <div className="blog-article-body">
            <div className="blog-meta-line blog-article-meta">
              <span>{post.category}</span>
              <span>{formatBlogDate(post.date, locale)}</span>
              <span>{post.author}</span>
            </div>
            <div className="blog-rich-content">
              {paragraphs.map((paragraph, index) => (
                <p key={`${post.slug}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
