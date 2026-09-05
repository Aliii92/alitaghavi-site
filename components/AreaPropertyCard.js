"use client";

import { usePathname } from "next/navigation";
import LeadWhatsAppButton from "./LeadWhatsAppButton";
import ProjectImage from "./ProjectImage";
import { advisorForOwner } from "../lib/advisors.js";
import { advisorFromPathname } from "../lib/public-context.js";
import { getPropertyImage } from "../lib/get-image-src.js";
import { formatPriceDisplay } from "../lib/price.js";

const defaultWhatsAppNumber = "971522950316";

const cardCopy = {
  en: {
    available: "Available",
    vacant: "Vacant",
    rented: "Rented",
    vot: "VOT",
    ready: "Ready",
    resaleOffPlan: "Resale Off-Plan",
    offPlan: "Off-Plan",
    bedrooms: "Bedrooms",
    br: "BR",
    price: "Price",
    button: "View Details",
    language: "EN",
    whatsappIntro: (name) => `Hello ${name}, I would like the full details for this property:`,
    property: "Property",
    location: "Location",
    type: "Type",
    messageClose: "Please share availability, viewing options, and similar units if available.",
    leadPreview: (title, area) => `Full details requested for ${title || "a property"} in ${area}.`,
    offPlanCopy: (building) => `A carefully selected off-plan opportunity in ${building} for buyers planning ahead with confidence.`,
    upgradedCopy: (type, view) => `A ready ${type} with ${view}, upgraded presentation, and strong appeal for end-users or investors.`,
    readyCopy: (type, building, view) => `A ready ${type} in ${building} with ${view}, selected for lifestyle quality and buyer confidence.`,
    home: "home",
    residence: "residence"
  },
  fa: {
    available: "آماده بازدید",
    vacant: "خالی",
    rented: "اجاره رفته",
    vot: "خالی در زمان انتقال",
    ready: "آماده",
    resaleOffPlan: "ریسل آف‌پلن",
    offPlan: "آف‌پلن",
    bedrooms: "خواب",
    br: "خواب",
    price: "قیمت",
    button: "مشاهده جزئیات",
    language: "FA",
    whatsappIntro: (name) => `سلام ${name}، لطفاً جزئیات کامل این ملک را ارسال کنید:`,
    property: "ملک",
    location: "لوکیشن",
    type: "نوع",
    messageClose: "لطفاً موجودی، امکان بازدید و گزینه‌های مشابه را هم ارسال کنید.",
    leadPreview: (title, area) => `درخواست جزئیات کامل برای ${title || "یک ملک"} در ${area}.`,
    offPlanCopy: (building) => `فرصتی آف‌پلن و منتخب در ${building} برای خریدارانی که با دید بلندمدت تصمیم می‌گیرند.`,
    upgradedCopy: (type, view) => `${type} آماده با ${view}، با ارائه ارتقایافته و جذابیت خوب برای سکونت یا سرمایه‌گذاری.`,
    readyCopy: (type, building, view) => `${type} آماده در ${building} با ${view}، منتخب برای کیفیت زندگی و تصمیم‌گیری مطمئن.`,
    home: "خانه",
    residence: "اقامتگاه"
  }
};

function advisorForProperty(property, fallbackName, fallbackPhone) {
  const advisor = advisorForOwner(property.owner);
  return {
    owner: advisor.owner,
    name: advisor.name || fallbackName,
    firstName: advisor.firstName || advisor.name?.split(" ")[0] || "Ali",
    phoneNumber: advisor.phoneNumber || fallbackPhone || defaultWhatsAppNumber
  };
}

function normalizedInventoryType(property) {
  return String(property?.inventory_type || property?.category || "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-");
}

function categoryLabelForProperty(property, copy) {
  const raw = normalizedInventoryType(property);
  if (raw === "off-plan" || raw === "offplan") return copy.offPlan;
  if (raw === "resale-off-plan" || raw === "resale-offplan" || raw === "resaleoffplan") return copy.resaleOffPlan;
  return copy.ready;
}

function occupancyLabelForProperty(property, copy) {
  const raw = String(property?.status || "").toLowerCase().trim();
  if (raw === "vacant") return copy.vacant;
  if (raw === "rented") return copy.rented;
  if (raw === "vot") return copy.vot;
  return raw ? property.status : copy.available;
}

function titleIncludesBedroomInfo(title, bedrooms) {
  const normalizedTitle = String(title || "").toLowerCase();
  const normalizedBedrooms = String(bedrooms || "").toLowerCase().trim();

  if (!normalizedTitle || !normalizedBedrooms) return false;
  if (normalizedBedrooms.includes("studio")) return normalizedTitle.includes("studio");

  const count = normalizedBedrooms.match(/\d+/)?.[0];
  if (!count) return false;

  return new RegExp(`\\b${count}\\s*(bed|beds|bedroom|bedrooms|br|bhk)\\b`, "i").test(normalizedTitle);
}

function buildAreaWhatsAppUrl(property, areaName, advisor, locale = "en") {
  const copy = cardCopy[locale === "fa" ? "fa" : "en"];
  const propertyArea = property.area || areaName;
  const location = [propertyArea, property.building].filter(Boolean).join(" / ");
  const type = [
    property.property_type,
    property.bedrooms && !titleIncludesBedroomInfo(property.title, property.bedrooms)
      ? `${property.bedrooms} ${copy.bedrooms}`
      : ""
  ].filter(Boolean).join(" / ");
  const displayPrice = formatPriceDisplay(property.price, { locale });
  const message = [
    copy.whatsappIntro(advisor.firstName),
    "",
    `${copy.property}: ${property.title || "-"}`,
    `${copy.location}: ${location || "-"}`,
    `${copy.type}: ${type || "-"}`,
    `${copy.price}: ${displayPrice}`,
    "",
    copy.messageClose
  ].join("\n");
  return `https://wa.me/${advisor.phoneNumber}?text=${encodeURIComponent(message)}`;
}

function buildAreaLead(property, areaName, advisor, sourcePage, locale = "en") {
  const copy = cardCopy[locale === "fa" ? "fa" : "en"];
  const propertyArea = property.area || areaName;
  const message = copy.leadPreview(property.title, propertyArea);

  return {
    owner: advisor.owner,
    advisor_name: advisor.name,
    source_page: sourcePage || `Area Page: ${areaName}`,
    property_id: property.id || "",
    property_title: property.title || "",
    area: propertyArea,
    building: property.building || "",
    property_type: property.property_type || "",
    bedrooms: property.bedrooms || "",
    price: property.price || "",
    language_mode: copy.language,
    whatsapp_target_number: advisor.phoneNumber,
    message_preview: message
  };
}

function buildOpportunityCopy(property, areaName, locale = "en") {
  const copy = cardCopy[locale === "fa" ? "fa" : "en"];
  const propertyArea = property.area || areaName;
  const view = property.view || propertyArea;
  const building = property.building || propertyArea;
  const notes = String(property.notes || property.furnishing || "");
  const type = property.property_type === "villa" ? copy.home : copy.residence;

  if (normalizedInventoryType(property) === "off-plan") {
    return copy.offPlanCopy(building);
  }

  if (notes.toLowerCase().includes("upgraded")) {
    return copy.upgradedCopy(type, view);
  }

  return copy.readyCopy(type, building, view);
}

export default function AreaPropertyCard({
  property,
  areaName,
  advisorName = "Ali Taghavi",
  sourcePage = "",
  phoneNumber = defaultWhatsAppNumber,
  locale = "en"
}) {
  const pathname = usePathname();
  const copy = cardCopy[locale === "fa" ? "fa" : "en"];
  const contextOwner = advisorFromPathname(pathname, "ali");
  const advisor = advisorForProperty({ owner: contextOwner }, advisorName, phoneNumber);
  const propertyArea = property.area || areaName;
  const bedroomLabel =
    property.bedrooms && !titleIncludesBedroomInfo(property.title, property.bedrooms)
      ? `${property.bedrooms} ${copy.br}`
      : "";
  const specLine = [bedroomLabel, property.size, property.view].filter(Boolean).join(" • ");
  const displayPrice = formatPriceDisplay(property.price, { locale });
  const imageSrc = getPropertyImage(property);
  const categoryLabel = categoryLabelForProperty(property, copy);
  const occupancyLabel = occupancyLabelForProperty(property, copy);
  const detailsHref = `${locale === "fa" ? "/fa" : ""}/properties/${encodeURIComponent(property.id)}`;

  return (
    <article className="listing-card compact-listing-card">
      <a className="property-card-link-shell" href={detailsHref}>
        <ProjectImage
          className="listing-image compact-listing-image property-card-image"
          src={imageSrc}
          alt={property.title || "Property image"}
        />
      </a>
      <div className="listing-content">
        <div className="compact-card-topline">
          <span className="listing-label">{categoryLabel}</span>
          <span className="listing-badge">{property.building || propertyArea}</span>
          <span className="compact-status-line">{occupancyLabel}</span>
        </div>
        <h3>
          <a className="property-card-link-shell property-card-title-link" href={detailsHref}>
            {property.title}
          </a>
        </h3>
        {specLine ? <p className="property-spec-line">{specLine}</p> : null}
        <p className="compact-listing-detail">{property.short_description || property.view || propertyArea}</p>
        <div className="price-row">
          <span>{copy.price}</span>
          <strong>{displayPrice}</strong>
        </div>
        <a className="button secondary-button" href={detailsHref}>{copy.button}</a>
        <LeadWhatsAppButton
          className="button whatsapp-button"
          href={buildAreaWhatsAppUrl(property, areaName, advisor, locale)}
          lead={buildAreaLead(property, areaName, advisor, sourcePage, locale)}
        >
          {locale === "fa" ? "استعلام در واتساپ" : "Enquire on WhatsApp"}
        </LeadWhatsAppButton>
      </div>
    </article>
  );
}


