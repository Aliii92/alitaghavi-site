import { getPropertyDeal } from "../lib/property-deals.js";

export default function PropertyDealBadge({ property, locale = "en", details = false }) {
  const deal = getPropertyDeal(property);
  if (!deal) return null;
  const fa = locale === "fa";
  const labels = fa
    ? { distress: "دیسترس", urgent: "فروش فوری", "below-market": "زیر قیمت بازار", special: "فرصت ویژه" }
    : { distress: "Distress Deal", urgent: "Urgent Sale", "below-market": "Below Market", special: "Special Opportunity" };
  const discount = deal.discount > 0 ? new Intl.NumberFormat(fa ? "fa-IR" : "en-US", { maximumFractionDigits: 1 }).format(deal.discount) : null;
  return <div className="property-deal-info">
    <span className={`property-deal-badge deal-${deal.type}`}>{labels[deal.type]}</span>
    {discount ? <span className="property-deal-saving">{fa ? `${discount}٪ پایین‌تر از قیمت مرجع` : `${discount}% below reference price`}</span> : null}
    {details && deal.reference_url ? <p className="property-deal-reference"><a href={deal.reference_url} target="_blank" rel="noopener noreferrer">{fa ? "منبع مقایسه قیمت" : "Price comparison source"}</a> · {deal.verified_at}</p> : null}
  </div>;
}
