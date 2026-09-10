import AreaPropertyCard from "./AreaPropertyCard";
import { getPropertyDeal, sortPropertiesByDeals } from "../lib/property-deals.js";

export default function PropertyDealsSection({ properties = [], locale = "en", limit = 6 }) {
  const deals = sortPropertiesByDeals(properties.filter(p => getPropertyDeal(p))).slice(0, limit);
  if (!deals.length) return null;
  const fa = locale === "fa";
  return <section className="section property-deals-section" id="special-opportunities">
    <div className="section-header"><p className="section-eyebrow">{fa ? "منتخب علی تقوی" : "SELECTED BY ALI TAGHAVI"}</p>
      <h2>{fa ? "فرصت‌های ویژه خرید" : "Special Buying Opportunities"}</h2>
      <p className="section-text">{fa ? "ملک‌های دیسترس، فروش فوری و فرصت‌های قیمت‌گذاری؛ جزئیات هر پیشنهاد را بررسی کنید." : "Distress listings, urgent sales and selected pricing opportunities. Explore the details of each offer."}</p>
    </div>
    <div className="three-column-grid">{deals.map(property => <AreaPropertyCard key={property.id} property={property} areaName={property.area} locale={locale} sourcePage="Special opportunities" />)}</div>
  </section>;
}
