import { headers } from "next/headers";
import "./globals.css";
import UtmCapture from "../components/UtmCapture";
import { getRequestLocale } from "../lib/server-locale";

const siteUrl = "https://www.alitaghavi.ae";

const baseMetadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ali Taghavi | Dubai Luxury Real Estate Advisor",
    template: "%s | Ali Taghavi"
  },
  description:
    "Advisor-led access to ready properties and off-plan opportunities across Dubai's prime luxury locations.",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      fa: "/fa"
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Ali Taghavi Dubai Real Estate",
    title: "Ali Taghavi | Dubai Luxury Real Estate Advisor",
    description:
      "Advisor-led access to ready properties and off-plan opportunities across Dubai's prime luxury locations.",
    images: [
      {
        url: "/dubai-hero.png",
        width: 1600,
        height: 900,
        alt: "Dubai skyline luxury real estate advisory"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Ali Taghavi | Dubai Luxury Real Estate Advisor",
    description:
      "Advisor-led access to ready properties and off-plan opportunities across Dubai's prime luxury locations.",
    images: ["/dubai-hero.png"]
  },
  robots: {
    index: true,
    follow: true
  }
};

export async function generateMetadata() {
  const requestHeaders = await headers();
  const visible = requestHeaders.get("x-visible-pathname") || "/";
  const english = visible.replace(/^\/fa(?=\/|$)/, "") || "/";
  const persian = english === "/" ? "/fa" : `/fa${english}`;
  return { ...baseMetadata, alternates: { canonical: visible, languages: { en: english, fa: persian } },
    openGraph: { ...baseMetadata.openGraph, url: visible, locale: visible.startsWith("/fa") ? "fa_IR" : "en_US" } };
}

export default async function RootLayout({ children }) {
  const locale = await getRequestLocale();
  const schema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: "Ali Taghavi",
    url: siteUrl,
    areaServed: "Dubai",
    telephone: "+971522950316",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressCountry: "AE"
    },
    knowsAbout: ["Dubai luxury real estate", "Ready properties", "Off-plan projects", "Palm Jumeirah", "Downtown Dubai"]
  };

  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <UtmCapture />
        {children}
      </body>
    </html>
  );
}

