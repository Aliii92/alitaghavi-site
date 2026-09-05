import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { readProperties, isPubliclyVisibleProperty } from "../../../lib/properties";
import { getRequestLocale } from "../../../lib/server-locale";
import { localizePath } from "../../../lib/locale";
import { formatPriceDisplay } from "../../../lib/price";
import { getPropertyImage } from "../../../lib/get-image-src";
import ResponsiveNavbar from "../../../components/ResponsiveNavbar";
import LeadWhatsAppButton from "../../../components/LeadWhatsAppButton";

const findProperty = cache(async id => (await readProperties()).find(p => p.id === id && isPubliclyVisibleProperty(p)));
export async function generateMetadata({ params }) {
  const { id } = await params;
  const property = await findProperty(id);
  if (!property) return { title: "Property unavailable", robots: { index: false } };
  const locale = await getRequestLocale();
  const url = `https://www.alitaghavi.ae${localizePath(`/properties/${encodeURIComponent(id)}`, locale)}`;
  return { title: property.title, description: property.short_description || `${property.building} · ${property.area} · ${property.size} · ${formatPriceDisplay(property.price)}`,
    alternates: { canonical: url, languages: { en: `https://www.alitaghavi.ae/properties/${encodeURIComponent(id)}`, fa: `https://www.alitaghavi.ae/fa/properties/${encodeURIComponent(id)}` } },
    openGraph: { title: property.title, url, images: property.image_url ? [{ url: new URL(property.image_url, "https://www.alitaghavi.ae").href }] : [] },
    twitter: { title: property.title, images: property.image_url ? [new URL(property.image_url, "https://www.alitaghavi.ae").href] : [] }
  };
}
export default async function PropertyPage({ params }) {
  const { id } = await params;
  const [property, locale] = await Promise.all([findProperty(id), getRequestLocale()]);
  if (!property) notFound();
  const fa = locale === "fa";
  const href = path => localizePath(path, locale);
  const pageUrl = `https://www.alitaghavi.ae${href(`/properties/${encodeURIComponent(id)}`)}`;
  const message = `${fa ? "سلام علی، درباره این ملک اطلاعات بیشتری می‌خواهم:" : "Hi Ali, I would like more details about this property:"}\n${property.title}\n${property.building} · ${property.area}\n${formatPriceDisplay(property.price, { locale })}\n${pageUrl}`;
  const whatsapp = `https://wa.me/971522950316?text=${encodeURIComponent(message)}`;
  const specs = [[fa ? "تعداد خواب" : "Bedrooms",property.bedrooms], [fa ? "متراژ" : "Size",property.size], [fa ? "چشم‌انداز" : "View",property.view], [fa ? "مبلمان" : "Furnishing",property.furnishing], [fa ? "وضعیت" : "Status",property.status], [fa ? "تحویل" : "Handover",property.handover]].filter(([,v])=>v);
  const images = [...new Set([getPropertyImage(property), ...(property.gallery_images || [])])];
  return <main className={`luxury-page property-detail ${fa ? "rtl" : ""}`}>
    <ResponsiveNavbar brandLabel="Ali Taghavi" brandHref={href("/")} locale={locale} links={[{ href:href("/ready-properties"),label:fa ? "املاک آماده" : "Ready properties" },{href:href("/resale-off-plan"),label:fa ? "ریسل آف‌پلن" : "Resale off-plan"},{href:href("/#contact"),label:fa ? "مشاوره" : "Consultation"}]} />
    <div className="content-shell detail-shell">
      <a className="detail-back" href={href("/listings")}>{fa ? "بازگشت به املاک" : "Back to properties"}</a>
      <div className="detail-heading"><div><p className="section-eyebrow">{property.area} / {property.building}</p><h1>{property.title}</h1></div><strong className="detail-price" dir="ltr">{formatPriceDisplay(property.price,{locale})}</strong></div>
      <div className="detail-main-image"><Image src={images[0]} alt={property.title} fill priority sizes="(max-width: 760px) 100vw, 1200px" unoptimized={!images[0].startsWith("/")} /></div>
      {images.length > 1 && <div className="detail-gallery">{images.slice(1).map((src,i)=><a href={src} key={src} target="_blank" rel="noopener noreferrer"><Image src={src} width={500} height={360} unoptimized alt={`${property.title} — ${i+2}`} /></a>)}</div>}
      <div className="detail-columns"><section><h2>{fa ? "جزئیات ملک" : "The details"}</h2><dl className="detail-specs">{specs.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{property.short_description && <p className="detail-description">{property.short_description}</p>}
        {property.floor_plan_url && <a className="button secondary-button" href={property.floor_plan_url} target="_blank" rel="noopener noreferrer">{fa ? "مشاهده پلان کامل PDF" : "View full floor plan PDF"}</a>}
      </section><aside className="detail-enquiry"><p className="section-eyebrow">ALI TAGHAVI</p><h2>{fa ? "این ملک را بیشتر بشناسید" : "Picture yourself here."}</h2><p>{fa ? "برای تأیید موجودی، هماهنگی بازدید و بررسی گزینه‌های مشابه، مستقیم با من گفتگو کنید." : "Ask about availability, arrange a viewing, or discuss similar properties."}</p><LeadWhatsAppButton className="button whatsapp-button" href={whatsapp} lead={{ property_id:id,property_title:property.title,area:property.area,building:property.building,price:property.price,source_page:"Property details",language_mode:locale.toUpperCase(),message_preview:message }}>{fa ? "گفتگو با علی در واتساپ" : "Enquire with Ali"}</LeadWhatsAppButton><a className="detail-phone" href="tel:+971522950316" dir="ltr">+971 52 295 0316</a></aside></div>
    </div>
  </main>;
}
