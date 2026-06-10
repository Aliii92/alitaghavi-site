import { resolvePublicAdvisor } from "./public-context.js";
import { formatPriceDisplay } from "./price.js";

export function buildPropertyWhatsAppMessage({ property, advisor = "Ali", locale = "en" }) {
  const title = property.title || property.name || "-";
  const location = [property.area, property.building || property.badge].filter(Boolean).join(" / ") || "-";
  const typeMap =
    locale === "fa"
      ? {
          apartment: "آپارتمان",
          villa: "ویلا",
          townhouse: "تاون هاوس",
          penthouse: "پنت هاوس",
          property: "ملک"
        }
      : {
          apartment: "Apartment",
          villa: "Villa",
          townhouse: "Townhouse",
          penthouse: "Penthouse",
          property: "Property"
        };
  const rawType = property.property_type || property.type || "property";
  const readableType = typeMap[rawType] || rawType;
  const bedroomLabel = property.bedrooms ? (locale === "fa" ? `${property.bedrooms} خوابه` : `${property.bedrooms} Bedrooms`) : "";
  const type = [readableType, bedroomLabel].filter(Boolean).join(" / ");
  const price = formatPriceDisplay(property.price, { locale });
  const size = property.size || "";
  const ref = property.id ? `\n\nRef: ${property.id}` : "";

  return locale === "fa"
    ? [
        "سلام علی، من به این ملک علاقه‌مندم:",
        "",
        `نام ملک: ${title}`,
        `لوکیشن: ${location}`,
        `نوع: ${type}`,
        `قیمت: ${price}`,
        "",
        `من این ملک را در سایت شما دیدم. لطفاً اطلاعات بیشتری ارسال کنید.${ref}`
      ].join("\n")
    : [
        `Hello ${advisor}, I would like the full details for this property:`,
        "",
        `Property: ${title}`,
        `Location: ${location}`,
        `Type: ${type}`,
        ...(size ? [`Size: ${size}`] : []),
        `Price: ${price}`,
        "",
        "Source: Ali Taghavi Website",
        "",
        `Please share availability, viewing options, and similar units if available.${ref}`
      ].join("\n");
}

export function buildPropertyWhatsAppUrl({ property, advisor, locale = "en", phoneNumber, advisorOwner, pathname }) {
  const resolvedAdvisor = resolvePublicAdvisor({
    advisorOwner,
    advisor,
    pathname,
    fallbackOwner: "ali"
  });
  const message = buildPropertyWhatsAppMessage({ property, advisor: resolvedAdvisor.advisor, locale });
  return `https://wa.me/${phoneNumber || resolvedAdvisor.phoneNumber}?text=${encodeURIComponent(message)}`;
}

export function buildLeadPayload({ property, advisor, locale = "en", phoneNumber, sourcePage, advisorOwner, pathname }) {
  const resolvedAdvisor = resolvePublicAdvisor({
    advisorOwner,
    advisor,
    pathname,
    fallbackOwner: "ali"
  });
  const message = buildPropertyWhatsAppMessage({ property, advisor: resolvedAdvisor.advisor, locale });

  return {
    owner: "ali",
    advisor_name: resolvedAdvisor.name,
    source_page: sourcePage || "Ali Taghavi Website",
    property_id: property.id || "",
    property_title: property.title || property.name || "",
    area: property.area || "",
    building: property.building || property.badge || "",
    property_type: property.property_type || property.type || "",
    bedrooms: property.bedrooms || "",
    price: property.price || "",
    language_mode: locale === "fa" ? "FA" : "EN",
    whatsapp_target_number: phoneNumber || resolvedAdvisor.phoneNumber,
    message_preview: message
  };
}
