export const metadata = {
  title: "Negin Mohamadi | Dubai Luxury Real Estate Advisor",
  description:
    "Independent Dubai luxury real estate advisory with Negin Mohamadi for ready homes, off-plan projects, and private buyer guidance.",
  alternates: {
    canonical: "/negin",
    languages: {
      en: "/negin",
      fa: "/negin?lang=fa"
    }
  },
  openGraph: {
    title: "Negin Mohamadi | Dubai Luxury Real Estate Advisor",
    description:
      "Independent Dubai luxury real estate advisory with Negin Mohamadi for ready homes, off-plan projects, and private buyer guidance.",
    url: "/negin",
    images: [
      {
        url: "/dubai-hero.png",
        width: 1600,
        height: 900,
        alt: "Dubai luxury real estate advisory with Negin Mohamadi"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Negin Mohamadi | Dubai Luxury Real Estate Advisor",
    description:
      "Independent Dubai luxury real estate advisory with Negin Mohamadi for ready homes, off-plan projects, and private buyer guidance.",
    images: ["/dubai-hero.png"]
  }
};

export default function NeginLayout({ children }) {
  return children;
}
