import { getNumericPrice } from "./price.js";
import { isPubliclyVisibleProperty } from "./property-visibility.js";

export function normalizeDeal(value) {
  const d = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    type: ["distress", "urgent", "below-market"].includes(d.type) ? d.type : "",
    reference_price: String(d.reference_price || "").slice(0, 50),
    reference_url: String(d.reference_url || "").slice(0, 500),
    verified_at: /^\d{4}-\d{2}-\d{2}$/.test(d.verified_at || "") ? d.verified_at : "",
    expires_at: /^\d{4}-\d{2}-\d{2}$/.test(d.expires_at || "") ? d.expires_at : ""
  };
}

export function getPropertyDeal(property, now = Date.now()) {
  if (!isPubliclyVisibleProperty(property)) return null;
  const d = normalizeDeal(property.deal);
  if (!d.type) return null;
  // A dated offer remains visible through the end of that day in Dubai.
  if (d.expires_at && !(Date.parse(d.expires_at + "T23:59:59.999+04:00") >= now)) return null;
  const price = getNumericPrice(property.price);
  const reference = getNumericPrice(d.reference_price);
  const verified = Date.parse(d.verified_at + "T00:00:00+04:00");
  let safeUrl = "";
  try {
    const url = new URL(d.reference_url);
    if (url.protocol === "https:" && !url.username && !url.password) safeUrl = url.href;
  } catch {}
  const validComparison = d.type === "below-market" && price >= 10000 && reference > price &&
    safeUrl && Number.isFinite(verified) && verified <= now && now - verified <= 30 * 86400000;
  return { ...d, type: d.type === "below-market" && !validComparison ? "special" : d.type,
    discount: validComparison ? Math.floor((1 - price / reference) * 1000) / 10 : null,
    reference_url: validComparison ? safeUrl : "" };
}

export function comparePropertyDeals(a, b) {
  return Number(Boolean(getPropertyDeal(b))) - Number(Boolean(getPropertyDeal(a)));
}

export function sortPropertiesByDeals(properties) {
  return [...properties].sort(comparePropertyDeals);
}
