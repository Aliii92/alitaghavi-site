import ResponsiveNavbar from "../../components/ResponsiveNavbar";
import { BLOG_PLACEHOLDER, getAllBlogPosts } from "../../lib/blog";
import { localizePath } from "../../lib/locale";
import { getRequestLocale } from "../../lib/server-locale";

export const metadata = {
  title: "Market Insights",
  description: "Editorial market insights, area analysis, and practical property commentary across Dubai's luxury real estate market.",
  alternates: {
    canonical: "/blog"
  }
};

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
        contact: "Contact",
        about: "About Me"
      };

  return [
    { href: localizePath("/ready-properties", locale), label: copy.ready },
    { href: localizePath("/off-plan-projects", locale), label: copy.offPlan },
    { href: localizePath("/resale-off-plan", locale), label: copy.resale },
    { href: localizePath("/blog", locale), label: copy.blog },
    { href: localizePath("/#areas", locale), label: copy.areas },
    { href: localizePath("/#contact", locale), label: copy.contact },
    { href: localizePath("/#advisory", locale), label: copy.about }
  ];
}

export default async function BlogIndexPage() {
  const locale = await getRequestLocale();
  const posts = await getAllBlogPosts(locale, { publishedOnly: true });
  const copy = locale === "fa"
    ? {
        brand: "املاک لوکس دبی",
        eyebrow: "تحلیل بازار",
        title: "مقاله‌ها و دیدگاه‌های بازار",
        text: "یادداشت‌های تحلیلی درباره لوکیشن‌ها، روند بازار، تصمیم‌گیری سرمایه‌گذاری و نکاتی که به خریداران برای انتخاب بهتر کمک می‌کند.",
        readMore: "مطالعه مقاله"
      }
    : {
        brand: "Dubai Luxury Properties",
        eyebrow: "Market Insights",
        title: "Editorial Market Insights",
        text: "A curated set of articles on Dubai locations, market behavior, and investment thinking designed to help buyers make more informed decisions.",
        readMore: "Read Article"
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
          </div>
        </section>

        <section className="section">
          <div className="three-column-grid blog-grid">
            {posts.map((post) => (
              <a className="listing-card blog-card" href={localizePath(`/blog/${post.slug}`, locale)} key={post.slug}>
                <img className="listing-image blog-card-image" src={post.coverImage || BLOG_PLACEHOLDER} alt={post.title} loading="lazy" />
                <div className="listing-content">
                  <span className="listing-label">{post.category}</span>
                  <span className="blog-meta-line">{formatBlogDate(post.date, locale)} · {post.author}</span>
                  <h3>{post.title}</h3>
                  <p className="listing-description">{post.excerpt}</p>
                  <span className="button secondary-button area-overview-button">{copy.readMore}</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

