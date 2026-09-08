import Image from "next/image";
import AreaPropertyCard from "./AreaPropertyCard";
import AreaPropertyFilters from "./AreaPropertyFilters";
import ProjectImage from "./ProjectImage";
import ResponsiveNavbar from "./ResponsiveNavbar";
import { getImageSrc } from "../lib/get-image-src";
import { resolveProjectImage } from "../lib/project-images";

function SectionHeader({ eyebrow, title, text, centered = true, dark = false, className = "" }) {
  return (
    <div className={`section-header ${centered ? "centered" : ""} ${dark ? "dark" : ""} ${className}`}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {text ? <p className="section-text">{text}</p> : null}
    </div>
  );
}

function YouTubeIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21.6 7.2s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C15.8 4 12 4 12 4s-3.8 0-6.7.2c-.4 0-1.3.1-2.1.9-.6.6-.8 2.1-.8 2.1S2.2 9 2.2 10.8v1.7c0 1.8.2 3.6.2 3.6s.2 1.5.8 2.1c.8.8 1.9.8 2.4.9 1.7.2 6.4.2 6.4.2s3.8 0 6.7-.2c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.8.2-3.6v-1.7c0-1.8-.2-3.6-.2-3.6ZM10.1 14.7V8.5l5.8 3.1-5.8 3.1Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12.04 2.4a9.54 9.54 0 0 0-8.2 14.43L2.4 21.6l4.92-1.29a9.47 9.47 0 0 0 4.7 1.2h.01A9.53 9.53 0 0 0 21.6 12 9.56 9.56 0 0 0 12.04 2.4Zm0 17.36h-.01a7.88 7.88 0 0 1-4.02-1.1l-.29-.17-2.9.76.78-2.82-.18-.3a7.89 7.89 0 0 1-1.21-4.2 7.83 7.83 0 0 1 7.83-7.82c2.09 0 4.06.81 5.53 2.29A7.76 7.76 0 0 1 19.4 12a7.83 7.83 0 0 1-7.36 7.76Zm4.29-5.86c-.23-.11-1.39-.69-1.6-.76-.21-.08-.37-.11-.52.11-.15.23-.6.76-.73.91-.13.15-.27.17-.5.06-.23-.11-.99-.36-1.88-1.16a6.96 6.96 0 0 1-1.3-1.62c-.13-.23-.02-.36.11-.48.1-.1.23-.27.35-.4.12-.13.16-.23.23-.38.08-.15.04-.29-.02-.4-.06-.12-.52-1.26-.71-1.72-.19-.45-.38-.39-.52-.4h-.44c-.15 0-.4.06-.62.29-.21.23-.81.79-.81 1.93s.83 2.24.95 2.39c.11.15 1.64 2.5 3.97 3.51.56.24.98.38 1.33.5.56.18 1.07.15 1.47.09.45-.07 1.39-.56 1.58-1.1.19-.54.19-1.01.14-1.1-.06-.1-.21-.16-.44-.27Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.2 2.4h9.6A4.8 4.8 0 0 1 21.6 7.2v9.6a4.8 4.8 0 0 1-4.8 4.8H7.2a4.8 4.8 0 0 1-4.8-4.8V7.2A4.8 4.8 0 0 1 7.2 2.4Zm0 1.8A3 3 0 0 0 4.2 7.2v9.6a3 3 0 0 0 3 3h9.6a3 3 0 0 0 3-3V7.2a3 3 0 0 0-3-3H7.2Zm10.05 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7.2A4.8 4.8 0 1 1 7.2 12 4.8 4.8 0 0 1 12 7.2Zm0 1.8A3 3 0 1 0 15 12a3 3 0 0 0-3-3Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg className="button-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6.1 8.2H3.3V20h2.8V8.2ZM4.7 3A1.7 1.7 0 1 0 4.8 6.4 1.7 1.7 0 0 0 4.7 3Zm15 9.7c0-3.5-1.9-5.1-4.4-5.1-2 0-2.9 1.1-3.4 1.9v-1.6H9.2c0 1 .1 11.8 0 11.8H12v-6.6c0-.4 0-.7.2-1 .4-.7 1.2-1.5 2.5-1.5 1.8 0 2.5 1.3 2.5 3.2V20H20c0-3.8-.1-7.3-.1-7.3Z" />
    </svg>
  );
}

function LocationCard({ card, cta, locale = "en" }) {
  const imageSrc = getImageSrc(card, "/images/property-placeholder.jpg");
  return (
    <a className="listing-card location-card" href={card.href}>
      <div
        className={`listing-image ${card.imageClass || ""}`}
        style={imageSrc ? { backgroundImage: `url("${imageSrc}")` } : undefined}
      ></div>
      <div className="listing-content">
        <span className="listing-label">{locale === "fa" ? "منطقه برتر" : "Prime Area"}</span>
        <span className="listing-badge">{locale === "fa" ? "ناحیه دبی" : "Dubai District"}</span>
        <h3>{card.title}</h3>
        <p className="listing-description">{card.description}</p>
        <span className="button secondary-button location-card-button">{cta}</span>
      </div>
    </a>
  );
}

function ProjectCard({ card }) {
  const imageSrc = resolveProjectImage(card);
  return (
    <article className="project-card">
      <ProjectImage
        className={`project-image ${card.imageClass || ""} project-card-image`}
        src={imageSrc}
        alt={card.title || "Off-plan project"}
      />
      <div className="project-content">
        <p className="project-brand">{card.brand || card.developer}</p>
        <h3>{card.title}</h3>
        <p className="project-description">{card.description}</p>
        <ul className="feature-list">
          {(card.features || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function AreaCard({ card }) {
  const imageSrc = getImageSrc(card, "/dubai-hero.png");
  return (
    <a className="area-card" href={card.href}>
      <div
        className={`area-image ${card.imageClass || ""}`}
        style={imageSrc ? { backgroundImage: `url("${imageSrc}")` } : undefined}
      ></div>
      <div className="area-content">
        <h3>{card.title}</h3>
        {card.description ? <p>{card.description}</p> : null}
        {card.bullets?.length ? (
          <ul className="feature-list">
            {card.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </a>
  );
}

function AdvisorySection({ data, locale = "en" }) {
  return (
    <section className="section section-advisory" id="advisory">
      <div className={`advisory-shell ${locale === "fa" ? "advisory-shell-fa" : "advisory-shell-en"}`}>
        <div className="advisory-copy">
          <h2>
            {data.headingLines[0]}
            <br />
            <span className="nowrap-name">{data.headingLines[1]}</span>
          </h2>
          <p className="advisory-intro">{data.intro}</p>
          <h3>{data.servicesTitle}</h3>
          <ul className="advisory-list">
            {data.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a className="button advisory-button" href="#contact">
            {data.cta}
          </a>
        </div>
        <Image className="advisory-photo" src={data.photoSrc} alt={data.photoAlt} width={640} height={800} sizes="(max-width: 760px) 100vw, 40vw" />
      </div>
    </section>
  );
}

export default function ProfileHomePage({
  locale = "en",
  brandLabel,
  brandHref,
  navLinks = [],
  hero,
  search,
  featured,
  selectedProperties = [],
  projects,
  areas,
  advisory,
  partnership,
  testimonials,
  contact,
  floatingWhatsappHref,
  floatingWhatsappLabel
}) {
  const followLabel = locale === "fa" ? "ما را دنبال کنید" : "Follow us";
  const socialLinks = [
    { href: contact.whatsappHref, label: contact.whatsapp || "WhatsApp", icon: <WhatsAppIcon />, className: "social-icon-whatsapp" },
    { href: contact.instagramHref, label: contact.instagram || "Instagram", icon: <InstagramIcon />, className: "social-icon-instagram" },
    { href: contact.youtubeHref, label: contact.youtube || "YouTube", icon: <YouTubeIcon />, className: "social-icon-youtube" },
    ...(contact.linkedinHref ? [{ href: contact.linkedinHref, label: contact.linkedin || "LinkedIn", icon: <LinkedInIcon />, className: "social-icon-linkedin" }] : [])
  ].filter((item) => item.href);

  return (
    <main className={`luxury-page ${locale === "fa" ? "rtl" : ""}`}>
      <ResponsiveNavbar
        brandLabel={brandLabel}
        brandHref={brandHref}
        links={navLinks}
        locale={locale}
      />

      <section className="hero-section" id="home">
        <Image src="/dubai-hero.png" alt={locale === "fa" ? "خط آسمان دبی" : "Dubai skyline"} fill priority sizes="100vw" className="hero-photograph" />
        <div className="hero-overlay"></div>
        <div className="hero-inner">
          <p className="hero-kicker">{hero.kicker}</p>
          <h1>
            {hero.titleLines[0]}
            <br />
            {hero.titleLines[1]}
          </h1>
          <p className="hero-description">{hero.description}</p>
          <div className="hero-actions">
            <a className="button whatsapp-button" href={hero.whatsappHref} target="_blank" rel="noopener noreferrer">
              {hero.whatsappLabel}
            </a>
            <a className="button ghost-button" href={hero.consultationHref}>
              {hero.consultationLabel}
            </a>
          </div>
        </div>
      </section>

      <div className="content-shell">
        <section className="section homepage-search-section">
          <SectionHeader
            eyebrow={search.eyebrow}
            title={search.title}
            text={search.text}
            className="homepage-search-header"
          />
          <AreaPropertyFilters {...search.filtersProps} locale={locale} />
        </section>

        <section className="section" id="featured">
          <SectionHeader eyebrow={locale === "fa" ? "منتخب علی تقوی" : "THE PRIVATE COLLECTION"}
            title={locale === "fa" ? "ملک‌هایی که ارزش دیدن دارند" : "Exceptional homes. Considered choices."}
            text={locale === "fa" ? "قیمت، متراژ و چشم‌انداز را ببینید؛ جزئیات هر ملک را جداگانه بررسی کنید." : "Explore the price, space and outlook. Get to know each property in detail."} />
          <div className="three-column-grid">
            {selectedProperties.length ? selectedProperties.map(property => (
              <AreaPropertyCard key={property.id} property={property} areaName={property.area} locale={locale} sourcePage="Homepage collection" />
            )) : featured.cards.map(card => <LocationCard key={card.title} card={card} cta={featured.cta} locale={locale} />)}
          </div>
          <div className="more-options-row"><a className="button secondary-button" href={featured.moreHref}>{locale === "fa" ? "مشاهده همه املاک آماده" : "Explore ready properties"}</a></div>
        </section>

        <section className="section" id="projects">
          <SectionHeader eyebrow={projects.eyebrow} title={projects.title} text={projects.text} className="offplan-section-header" />
          <div className="three-column-grid projects-grid">
            {projects.cards.map((card) => (
              <ProjectCard key={card.id || card.title} card={card} />
            ))}
          </div>
          {projects.moreHref ? (
            <div className="offplan-more-row">
              <a className="offplan-more-button" href={projects.moreHref}>
                {projects.moreLabel}
              </a>
            </div>
          ) : null}
        </section>

        <section className="section" id="areas">
          <SectionHeader eyebrow={areas.eyebrow} title={areas.title} text={areas.text} />
          <div className="stack-grid">
            {areas.cards.map((card) => (
              <AreaCard key={card.href || card.title} card={card} />
            ))}
          </div>
        </section>

        <AdvisorySection data={advisory} locale={locale} />

        {partnership?.title ? (
          <section className="section partnership-section">
            <div className="partnership-note">
              <p className="section-eyebrow">{partnership.eyebrow}</p>
              <h2>{partnership.title}</h2>
              <p>{partnership.text}</p>
              {partnership.href && partnership.link ? <a href={partnership.href}>{partnership.link}</a> : null}
            </div>
          </section>
        ) : null}

        {testimonials?.items?.length ? (
          <section className="section section-testimonials">
            <SectionHeader eyebrow={testimonials.eyebrow} title={testimonials.title} />
            <div className="three-column-grid testimonial-grid">
              {testimonials.items.map((item) => (
                <article className="testimonial-card" key={item.name + item.role}>
                  <p className="testimonial-quote">"{item.quote}"</p>
                  <div className="testimonial-meta">
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="section section-contact" id="contact">
          <SectionHeader eyebrow={contact.eyebrow} title={contact.title} text={contact.text} />

          <div className="consultation-panel">
            <form className="consultation-form" onSubmit={contact.onSubmit}>
              <div className="form-grid">
                <label>
                  <span>{contact.labels.name}</span>
                  <input type="text" name="name" required autoComplete="name" maxLength={120} value={contact.values.name} onChange={contact.onChange} placeholder={contact.placeholders.name} />
                </label>
                <label>
                  <span>{contact.labels.email}</span>
                  <input type="email" name="email" autoComplete="email" maxLength={254} value={contact.values.email} onChange={contact.onChange} placeholder={contact.placeholders.email} />
                </label>
                <label>
                  <span>{contact.labels.phone}</span>
                  <input type="tel" name="phone" required autoComplete="tel" dir="ltr" maxLength={40} value={contact.values.phone} onChange={contact.onChange} placeholder={contact.placeholders.phone} />
                </label>
                <label>
                  <span>{contact.labels.purpose}</span>
                  <select name="purpose" value={contact.values.purpose} onChange={contact.onChange}>
                    {contact.purposes.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{contact.labels.budget}</span>
                  <input type="text" name="budget" value={contact.values.budget} onChange={contact.onChange} placeholder={contact.placeholders.budget} />
                </label>
                <label>
                  <span>{contact.labels.area}</span>
                  <input type="text" name="area" value={contact.values.area} onChange={contact.onChange} placeholder={contact.placeholders.area} />
                </label>
              </div>

              <label className="full-width">
                <span>{contact.labels.message}</span>
                <textarea name="message" value={contact.values.message} onChange={contact.onChange} placeholder={contact.placeholders.message} rows={5}></textarea>
              </label>

              <button type="submit" disabled={contact.submitState === "sending"} className="button primary-button full-button">
                {contact.submitState === "sending" ? (locale === "fa" ? "در حال ثبت…" : "Sending…") : contact.submit}
              </button>
              <div role="status" aria-live="polite">
                {contact.submitState === "success" && <p>{locale === "fa" ? "درخواست شما ثبت شد. برای ادامهٔ گفتگو می‌توانید در واتساپ پیام بدهید." : "Your request has been received. You can also continue on WhatsApp."}</p>}
                {contact.submitState === "error" && <p>{locale === "fa" ? "درخواست ثبت نشد؛ دوباره تلاش کنید یا از واتساپ پیام بدهید." : "Your request could not be saved. Please retry or contact me on WhatsApp."}</p>}
                {["success", "error"].includes(contact.submitState) && <a className="button secondary-button" href={contact.followUpHref} target="_blank" rel="noopener noreferrer">{locale === "fa" ? "ادامه در واتساپ" : "Continue on WhatsApp"}</a>}
              </div>
            </form>

            <div className="contact-sidecards">
              <article className="contact-card">
                <h3>{contact.infoTitle}</h3>
                <div className="info-block">
                  <strong>{contact.addressTitle}</strong>
                  <p>{contact.address}</p>
                </div>
                <div className="info-block">
                  <strong>{contact.phoneTitle}</strong>
                  <p>{contact.phone}</p>
                </div>
              </article>

              <article className="contact-card">
                <h3>{contact.connectTitle}</h3>
                <div className="contact-social-row">
                  <span className="contact-social-label">{followLabel}</span>
                  <div className="contact-social-icons">
                    {socialLinks.map((item) => (
                        <a
                          key={item.label}
                          className={`social-icon-link ${item.className || ""}`}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                        aria-label={item.label}
                        title={item.label}
                      >
                        {item.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>

      <a className="floating-whatsapp" href={floatingWhatsappHref} target="_blank" rel="noopener noreferrer" aria-label={floatingWhatsappLabel}>
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16.04 3C8.88 3 3.06 8.82 3.06 15.98c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75a12.9 12.9 0 0 0 6.36 1.62h.01c7.16 0 12.98-5.82 12.98-12.98C29.03 8.82 23.2 3 16.04 3Zm0 23.66h-.01a10.76 10.76 0 0 1-5.48-1.5l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.74 10.74 0 0 1-1.65-5.73c0-5.89 4.8-10.68 10.7-10.68 2.85 0 5.53 1.11 7.55 3.13a10.61 10.61 0 0 1 3.12 7.55c0 5.89-4.8 10.68-10.69 10.68Zm5.86-8c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.72.16-.21.32-.82 1.05-1 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.77 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
    </main>
  );
}

