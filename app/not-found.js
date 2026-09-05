import Link from "next/link";
export default function NotFound() {
  return <main className="content-shell detail-shell"><p className="section-eyebrow">ALI TAGHAVI</p><h1>Property or page unavailable</h1><p>This page may have moved, or the property is no longer available.</p><p dir="rtl">این صفحه در دسترس نیست یا ملک دیگر موجود نیست.</p><Link className="button primary-button" href="/listings">Explore available properties</Link> <Link className="button secondary-button" href="/fa/listings">مشاهده املاک موجود</Link></main>;
}
