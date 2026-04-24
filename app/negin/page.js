"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AreaPropertyFilters from "../../components/AreaPropertyFilters";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import LeadWhatsAppButton from "../../components/LeadWhatsAppButton";
import { localizePath } from "../../lib/locale";
import { buildLeadPayload, buildPropertyWhatsAppUrl } from "../../lib/whatsapp";
import { formatPriceDisplay } from "../../lib/price";

const neginWhatsappNumber = "971505996547";
const instagramUrl = "https://instagram.com/";
const youtubeUrl = "https://www.youtube.com/@NeginMohamadi";

const content = {
  en: {
    dir: "ltr",
    nav: {
      featured: "Ready Properties",
      projects: "Off-Plan Projects",
      resale: "Resale Off-Plan",
      areas: "Prime Areas",
      advisory: "About Me",
      ali: "Ali Taghavi",
      contact: "Contact"
    },
    hero: {
      kicker: "Curated by Negin Mohamadi",
      titleLines: ["Luxury Dubai Advisory", "for Buyers & Investors"],
      description:
        "I help clients navigate Dubai's luxury property market with clarity, discretion, and carefully selected opportunities.",
      whatsapp: "WhatsApp Now",
      consultation: "Book Private Consultation"
    },
    featured: {
      eyebrow: "READY PROPERTIES",
      title: "Available Ready Properties for Living & Investment",
      text: "Curated ready homes across Dubai for end-users and investors",
      whatsapp: "Get Full Details",
      cards: [
        {
          id: "negin-palm-beach-residence",
          badge: "Palm Jumeirah",
          area: "Palm Jumeirah",
          building: "Palm Beach Residence",
          label: "Exclusive",
          title: "Palm Beach Residence",
          property_type: "apartment",
          description: "A ready waterfront home selected for privacy, lifestyle quality, and confident decision-making.",
          priceLabel: "Price",
          price: "AED 18,500,000",
          imageClass: "featured-one"
        },
        {
          id: "negin-downtown-skyline-home",
          badge: "Downtown Dubai",
          area: "Downtown Dubai",
          building: "Downtown Skyline Home",
          label: "Curated",
          title: "Downtown Skyline Home",
          property_type: "apartment",
          description: "A central city residence with strong daily-use appeal and a polished ownership experience.",
          priceLabel: "Price",
          price: "AED 7,800,000",
          imageClass: "featured-two"
        },
        {
          id: "negin-marina-view-residence",
          badge: "Dubai Marina",
          area: "Dubai Marina",
          building: "Marina View Residence",
          label: "Limited",
          title: "Marina View Residence",
          property_type: "apartment",
          description: "A bright high-floor option for buyers who want lifestyle convenience and long-term flexibility.",
          priceLabel: "Price",
          price: "AED 4,950,000",
          imageClass: "featured-three"
        }
      ]
    },
    projects: {
      eyebrow: "Off-Plan Luxury Developments",
      title: "Premium off-plan projects worth watching",
      text: "Selected developments with strong positioning, lifestyle quality, and future value potential.",
      cards: [
        {
          brand: "BRANDED RESIDENCES",
          title: "Waterfront Collection",
          description:
            "Selected branded homes for buyers seeking lifestyle quality and long-term value.",
          features: ["Prime waterfront address", "Premium developer", "Strong lifestyle positioning"],
          imageClass: "project-one"
        },
        {
          brand: "LUXURY LAUNCH",
          title: "Downtown Residences",
          description:
            "A refined off-plan opportunity in a central district with proven demand.",
          features: ["Central location", "Flexible payment plan", "Capital appreciation potential"],
          imageClass: "project-two"
        },
        {
          brand: "WELLNESS LIVING",
          title: "Wellness Villas",
          description:
            "A calm luxury community designed for privacy, comfort, and future growth.",
          features: ["Low-density community", "Family lifestyle", "Long-term investment appeal"],
          imageClass: "project-three"
        }
      ]
    },
    areas: {
      eyebrow: "Prime Dubai Areas",
      title: "Prime areas I guide clients toward",
      text: "Locations chosen for prestige, lifestyle quality, and investment potential.",
      cards: [
        {
          slug: "palm-jumeirah",
          title: "Palm Jumeirah",
          description:
            "I guide clients toward Palm Jumeirah when they value prestige, waterfront lifestyle, and scarcity-driven long-term appeal.",
          bullets: ["Waterfront luxury", "Global recognition", "Strong trophy-asset demand", "Premium branded residences"],
          imageClass: "area-two"
        },
        {
          slug: "downtown",
          title: "Downtown Dubai",
          description:
            "Downtown Dubai is ideal for clients who want central access, strong rental demand, and a polished urban lifestyle.",
          bullets: ["Burj Khalifa district", "High rental demand", "Central lifestyle", "Established luxury market"],
          imageClass: "area-one"
        }
      ]
    },
    advisory: {
      titleLines: ["Investment Advisory with", "Negin Mohamadi"],
      intro:
        "I work with buyers and investors who want a calm, clear, and highly personal approach to Dubai luxury real estate. My role is to help you understand the market, compare the right opportunities, and make a confident decision without pressure.",
      servicesTitle: "Services for Discerning Clients",
      bullets: [
        "Personal guidance for luxury buyers and investors",
        "Curated resale and off-plan opportunity selection",
        "Clear comparison of lifestyle, value, and location fit",
        "Calm decision support without pressure or rushed selling"
      ],
      cta: "Schedule Consultation"
    },
    partnership: {
      eyebrow: "WORKING ALONGSIDE ALI TAGHAVI",
      title: "Working with a trusted team",
      text:
        "I work closely with Ali Taghavi to provide clients with a more thoughtful, responsive, and well-rounded advisory experience. Our collaboration ensures each client benefits from stronger insight, strategic perspective, and a smoother decision-making process.",
      link: "Meet Ali Taghavi"
    },
    contact: {
      eyebrow: "Request a Consultation",
      title: "Let's find the right opportunity for you",
      text:
        "Tell me what you are looking for and I will help you evaluate the right path in Dubai's luxury property market.",
      infoTitle: "Contact Information",
      connectTitle: "Connect With Me",
      addressTitle: "Address",
      address: "Unit 201, Building 11, Bay Square, Business Bay, Dubai, UAE",
      phoneTitle: "Phone",
      whatsapp: "Contact via WhatsApp",
      instagram: "Follow on Instagram",
      youtube: "Watch on YouTube",
      submit: "Request Consultation",
      labels: {
        name: "Full Name",
        email: "Email Address",
        phone: "Phone Number",
        purpose: "Purpose",
        budget: "Budget",
        area: "Preferred Area",
        message: "Message"
      },
      placeholders: {
        name: "Your name",
        email: "your@email.com",
        phone: "+971 50 123 4567",
        budget: "AED range",
        area: "Palm Jumeirah, Downtown, Meydan...",
        message: "Tell me about your investment goals..."
      },
      purposes: ["Investment", "Primary Residence"]
    }
  },
  fa: {
    dir: "rtl",
    nav: {
      featured: "املاک منتخب",
      projects: "پروژه های لوکس",
      resale: "ری‌سیل آف‌پلن",
      areas: "مناطق برتر",
      advisory: "درباره من",
      contact: "ارتباط"
    },
    hero: {
      kicker: "منتخب و هدایت شده توسط نگین محمدی",
      titleLines: ["مشاوره املاک لوکس دبی", "برای خریداران و سرمایه گذاران"],
      description:
        "من به مشتریان کمک می کنم بازار املاک لوکس دبی را با شفافیت، آرامش و انتخاب های دقیق تر بررسی کنند.",
      whatsapp: "واتساپ",
      consultation: "رزرو مشاوره خصوصی"
    },
    featured: {
      eyebrow: "فرصت های منتخب",
      title: "منتخبی از املاک آماده برای زندگی و سرمایه‌گذاری در مناطق برتر دبی",
      text: "فرصت های ریسل منتخب با رویکردی مشاوره ای و مشتری محور",
      whatsapp: "دریافت جزئیات کامل",
      cards: [
        {
          badge: "Palm Jumeirah",
          label: "اختصاصی",
          title: "Palm Beach Residence",
          description: "زندگی واترفرانت شیک با امکانات ریزورت استایل.",
          priceLabel: "قیمت",
          price: "18,500,000 درهم",
          imageClass: "featured-one"
        },
        {
          badge: "Downtown Dubai",
          label: "منتخب",
          title: "Downtown Skyline Home",
          description: "اقامتی شهری و تمیز با دسترسی ممتاز به سبک زندگی دبی.",
          priceLabel: "قیمت",
          price: "7,800,000 درهم",
          imageClass: "featured-two"
        },
        {
          badge: "Dubai Marina",
          label: "محدود",
          title: "Marina View Residence",
          description: "واحدی روشن در طبقه بالا با جذابیت اجاره ای قوی.",
          priceLabel: "قیمت",
          price: "4,950,000 درهم",
          imageClass: "featured-three"
        }
      ]
    },
    projects: {
      eyebrow: "پروژه های لوکس آف پلن",
      title: "پروژه های پریمیوم آف پلن که ارزش بررسی دارند",
      text: "توسعه های منتخب با جایگاه قوی، کیفیت سبک زندگی و پتانسیل ارزش آینده.",
      cards: [
        {
          brand: "رزیدنس‌های برندد",
          title: "Waterfront Collection",
          description:
            "خانه های برندد منتخب برای خریدارانی که کیفیت زندگی و ارزش بلندمدت می خواهند.",
          features: ["آدرس واترفرانت ممتاز", "توسعه دهنده معتبر", "جایگاه قوی سبک زندگی"],
          imageClass: "project-one"
        },
        {
          brand: "لانچ لوکس",
          title: "Downtown Residences",
          description:
            "فرصتی آف پلن و پالیش شده در منطقه ای مرکزی با تقاضای اثبات شده.",
          features: ["لوکیشن مرکزی", "پلن پرداخت منعطف", "پتانسیل رشد سرمایه"],
          imageClass: "project-two"
        },
        {
          brand: "زندگی سلامت‌محور",
          title: "Wellness Villas",
          description:
            "کامیونیتی لوکس و آرام طراحی شده برای حریم خصوصی، آسایش و رشد آینده.",
          features: ["کامیونیتی کم تراکم", "سبک زندگی خانوادگی", "جذابیت سرمایه گذاری بلندمدت"],
          imageClass: "project-three"
        }
      ]
    },
    areas: {
      eyebrow: "مناطق برتر دبی",
      title: "مناطقی که به مشتریان پیشنهاد می کنم",
      text: "لوکیشن هایی منتخب برای پرستیژ، کیفیت زندگی و پتانسیل سرمایه گذاری.",
      cards: [
        {
          slug: "palm-jumeirah",
          title: "Palm Jumeirah",
          description:
            "زمانی Palm Jumeirah را پیشنهاد می کنم که مشتری به پرستیژ، زندگی واترفرانت و ارزش بلندمدت ناشی از کمیابی اهمیت می دهد.",
          bullets: ["لوکس واترفرانت", "شناخت جهانی", "تقاضای قوی برای دارایی تروفی", "رزیدنس های برندد پریمیوم"],
          imageClass: "area-two"
        },
        {
          slug: "downtown",
          title: "Downtown Dubai",
          description:
            "Downtown Dubai برای مشتریانی مناسب است که دسترسی مرکزی، تقاضای اجاره قوی و سبک زندگی شهری پالیش شده می خواهند.",
          bullets: ["منطقه برج خلیفه", "تقاضای اجاره بالا", "سبک زندگی مرکزی", "بازار لوکس تثبیت شده"],
          imageClass: "area-one"
        }
      ]
    },
    advisory: {
      titleLines: ["مشاوره سرمایه گذاری با", "نگین محمدی"],
      intro:
        "من با خریداران و سرمایه گذارانی کار می کنم که به دنبال رویکردی آرام، روشن و کاملا شخصی در بازار املاک لوکس دبی هستند. نقش من این است که به شما کمک کنم بازار را بهتر بفهمید، فرصت های درست را مقایسه کنید و بدون فشار تصمیمی مطمئن بگیرید.",
      servicesTitle: "خدمات برای مشتریان خاص",
      bullets: [
        "راهنمایی شخصی برای خریداران و سرمایه گذاران لوکس",
        "انتخاب فرصت های ریسل و آف پلن به صورت curated",
        "مقایسه روشن سبک زندگی، ارزش و تناسب لوکیشن",
        "پشتیبانی تصمیم گیری بدون فشار یا فروش عجولانه"
      ],
      cta: "رزرو جلسه مشاوره"
    },
    partnership: {
      eyebrow: "همکاری در کنار علی تقوی",
      title: "همراهی با یک تیم قابل اعتماد",
      text:
        "من در کنار علی تقوی کار می کنم تا مشتریان تجربه ای دقیق تر، پاسخگوتر و کامل تر از مشاوره دریافت کنند. این همکاری باعث می شود هر مشتری از بینش قوی تر، نگاه استراتژیک تر و روند تصمیم گیری روان تر بهره مند شود.",
      link: "آشنایی با علی تقوی"
    },
    contact: {
      eyebrow: "درخواست مشاوره",
      title: "بیایید فرصت مناسب شما را پیدا کنیم",
      text:
        "به من بگویید به دنبال چه هستید تا مسیر مناسب را در بازار املاک لوکس دبی با هم بررسی کنیم.",
      infoTitle: "اطلاعات تماس",
      connectTitle: "ارتباط با من",
      phoneTitle: "شماره تماس",
      whatsapp: "ارتباط از طریق واتساپ",
      instagram: "دنبال کردن در اینستاگرام",
      quickBrief: "ارسال سریع در واتساپ",
      submit: "درخواست مشاوره",
      labels: {
        name: "نام کامل",
        email: "ایمیل",
        phone: "شماره تماس",
        purpose: "هدف",
        budget: "بودجه",
        area: "منطقه مورد نظر",
        message: "پیام"
      },
      placeholders: {
        name: "نام شما",
        email: "your@email.com",
        phone: "+971 50 123 4567",
        budget: "بازه بودجه به درهم",
        area: "Palm Jumeirah، Downtown، Meydan...",
        message: "هدفتان از خرید یا سرمایه گذاری را بنویسید..."
      },
      purposes: ["سرمایه‌گذاری", "سکونت"]
    }
  }
};

function buildWhatsAppUrl(values, locale) {
  const lines =
    locale === "fa"
      ? [
          "سلام نگین محمدی،",
          "من از طریق سایت با شما ارتباط گرفتم.",
          `نام: ${values.name || "-"}`,
          `شماره تماس: ${values.phone || "-"}`,
          `ایمیل: ${values.email || "-"}`,
          `هدف: ${values.purpose || "-"}`,
          `بودجه: ${values.budget || "-"}`,
          `منطقه موردنظر: ${values.area || "-"}`,
          `پیام: ${values.message || "-"}`
        ]
      : [
          "Hello Negin Mohamadi,",
          "I came through your website.",
          `Name: ${values.name || "-"}`,
          `Phone: ${values.phone || "-"}`,
          `Email: ${values.email || "-"}`,
          `Purpose: ${values.purpose || "-"}`,
          `Budget: ${values.budget || "-"}`,
          `Preferred area: ${values.area || "-"}`,
          `Message: ${values.message || "-"}`
        ];

  return `https://wa.me/${neginWhatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function SectionHeader({ eyebrow, title, text, className = "" }) {
  return (
    <div className={`section-header centered ${className}`}>
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

function PropertyCard({ card, cta, locale = "en" }) {
  const whatsappHref = buildPropertyWhatsAppUrl({
    property: card,
    advisor: "Negin",
    locale,
    phoneNumber: neginWhatsappNumber
  });
  const lead = buildLeadPayload({
    property: card,
    advisor: "Negin",
    locale,
    phoneNumber: neginWhatsappNumber,
    sourcePage: "Negin Mohamadi Page"
  });
  const displayPrice = formatPriceDisplay(card.price, { locale });

  return (
    <article className="listing-card">
      <div className={`listing-image ${card.imageClass}`}></div>
      <div className="listing-content">
        <span className="listing-label">{card.label}</span>
        <span className="listing-badge">{card.badge}</span>
        <h3>{card.title}</h3>
        <p className="listing-description">{card.description}</p>
        <div className="price-row">
          <span>{card.priceLabel}</span>
          <strong>{displayPrice}</strong>
        </div>
        <LeadWhatsAppButton className="button whatsapp-button" href={whatsappHref} lead={lead}>
          {cta}
        </LeadWhatsAppButton>
      </div>
    </article>
  );
}

function ProjectCard({ card }) {
  return (
    <article className="project-card">
      <div className={`project-image ${card.imageClass}`}></div>
      <div className="project-content">
        <p className="project-brand">{card.brand}</p>
        <h3>{card.title}</h3>
        <p className="project-description">{card.description}</p>
        <ul className="feature-list">
          {card.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function AreaCard({ card, locale = "en" }) {
  return (
    <a className="area-card" href={localizePath(`/prime-areas/negin-${card.slug}`, locale)}>
      <div
        className={`area-image ${card.imageClass || ""}`}
        style={card.image_url ? { backgroundImage: `url("${card.image_url}")` } : undefined}
      ></div>
      <div className="area-content">
        <h3>{card.title}</h3>
        <p>{card.description}</p>
        <ul className="feature-list">
          {card.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
    </a>
  );
}

function localizeAreaCard(area, locale) {
  if (locale !== "fa") return area;

  const translations = {
    "palm-jumeirah": {
      title: "پالم جمیرا",
      description: "پالم جمیرا برای خریدارانی مناسب است که پرستیژ، سبک زندگی واترفرانت و ارزش بلندمدت ناشی از کمیابی را جدی می‌گیرند.",
      bullets: ["لوکس واترفرانت", "شناخت جهانی", "تقاضای قوی برای دارایی‌های خاص", "رزیدنس‌های برندد پریمیوم"]
    },
    downtown: {
      title: "داون‌تاون دبی",
      description: "داون‌تاون دبی برای مشتریانی مناسب است که دسترسی مرکزی، تقاضای اجاره بالا و سبک زندگی شهری ممتاز می‌خواهند.",
      bullets: ["منطقه برج خلیفه", "تقاضای اجاره بالا", "سبک زندگی مرکزی", "بازار لوکس تثبیت‌شده"]
    },
    bluewaters: {
      title: "بلوواترز",
      description: "بلوواترز مقصدی واترفرانت با رزیدنس‌های لوکس، ویوی دریا و جذابیت قوی برای زندگی و سرمایه‌گذاری است.",
      bullets: ["آدرس واترفرانت", "ویوی دریا", "سبک زندگی شاخص", "تقاضای ممتاز"]
    },
    meydan: {
      title: "میدان",
      description: "میدان گزینه‌ای رو به رشد برای خریدارانی است که به کامیونیتی‌های جدید، ویلاهای لوکس و افق بلندمدت توجه دارند.",
      bullets: ["رشد زیرساختی", "کامیونیتی‌های لوکس", "مناسب خانواده‌ها", "پتانسیل بلندمدت"]
    }
  };
  const localized = translations[area.slug] || {};
  return {
    ...area,
    title: localized.title || area.title,
    description: localized.description || area.description,
    bullets: localized.bullets || area.bullets
  };
}

export default function NeginPage() {
  const pathname = usePathname();
  const [locale, setLocale] = useState(pathname?.startsWith("/fa") ? "fa" : "en");
  const [editableAreas, setEditableAreas] = useState([]);
  const t = content[locale];
  const areaImageMap = new Map(editableAreas.map((area) => [area.slug || area.id, area.image_url]));
  const managedPrimeAreas = editableAreas
    .filter((area) => area.active !== false && area.featured !== false)
    .sort((left, right) => (left.display_order || 0) - (right.display_order || 0));
  const primeAreaCards = managedPrimeAreas.length
    ? managedPrimeAreas.map((area) => ({
        slug: area.slug,
        title: area.overview_card_title || area.area_name || area.name,
        description: area.short_description || area.note,
        bullets: area.bullet_points || area.notes || [],
        image_url: area.image_url,
        imageClass: ""
      })).map((area) => localizeAreaCard(area, locale))
    : t.areas.cards.map((card) => ({
        ...card,
        image_url: areaImageMap.get(card.slug),
        imageClass: card.slug ? "" : card.imageClass
      })).map((area) => localizeAreaCard(area, locale));
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: content.en.contact.purposes[0],
    budget: "",
    area: "",
    message: ""
  });

  useEffect(() => {
    setLocale(pathname?.startsWith("/fa") ? "fa" : "en");
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = locale === "fa" ? "fa" : "en";
    document.documentElement.dir = t.dir;
    setFormData((current) => ({
      ...current,
      purpose: content[locale].contact.purposes[0]
    }));
  }, [locale, t.dir]);

  useEffect(() => {
    fetch("/api/areas?owner=negin")
      .then((response) => response.json())
      .then((areas) => setEditableAreas(Array.isArray(areas) ? areas : []))
      .catch(() => setEditableAreas([]));
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    window.open(buildWhatsAppUrl(formData, locale), "_blank", "noopener,noreferrer");
  }

  return (
    <main className={`luxury-page ${locale === "fa" ? "rtl" : ""}`}>
      <div className="nav-shell">
        <nav className="topbar">
          <a className="brand" href={localizePath("/negin", locale)}>
            Negin Mohamadi
          </a>
          <div className="nav-links">
            <a href={localizePath("/negin/ready-properties", locale)}>{t.nav.featured}</a>
            <a href={localizePath("/negin/off-plan", locale)}>{t.nav.projects}</a>
            <a href={localizePath("/negin/resale-off-plan", locale)}>{t.nav.resale}</a>
            <a href={localizePath("/negin#areas", locale)}>{t.nav.areas}</a>
            <a href={localizePath("/", locale)}>{t.nav.ali || "Ali Taghavi"}</a>
            <a href={localizePath("/negin#contact", locale)}>{t.nav.contact}</a>
            <a href={localizePath("/negin#advisory", locale)}>{t.nav.advisory}</a>
          </div>
          <LanguageSwitcher locale={locale} />
        </nav>
      </div>

      <section className="hero-section" id="home">
        <div className="hero-overlay"></div>
        <div className="hero-inner">
          <p className="hero-kicker">{t.hero.kicker}</p>
          <h1>
            {t.hero.titleLines[0]}
            <br />
            {t.hero.titleLines[1]}
          </h1>
          <p className="hero-description">{t.hero.description}</p>
          <div className="hero-actions">
            <a className="button whatsapp-button" href={`https://wa.me/${neginWhatsappNumber}`} target="_blank" rel="noopener noreferrer">
              {t.hero.whatsapp}
            </a>
            <a className="button ghost-button" href={localizePath("/negin#contact", locale)}>
              {t.hero.consultation}
            </a>
          </div>
        </div>
      </section>

      <div className="content-shell">
        <section className="section homepage-search-section">
          <SectionHeader
            eyebrow={locale === "fa" ? "جستجوی ملک" : "Property Search"}
            title={locale === "fa" ? "فرصت مناسب در دبی را با نگین پیدا کنید" : "Find the right Dubai opportunity with Negin"}
            text={locale === "fa" ? "بر اساس منطقه، ساختمان، تعداد خواب، بودجه و وضعیت آماده یا آف‌پلن جستجو کنید." : "Search by area, building, bedrooms, price, and ready or off-plan status."}
            className="homepage-search-header"
          />
          <AreaPropertyFilters
            mode="redirect"
            areaName="Dubai"
            advisorName="Negin Mohamadi"
            phoneNumber={neginWhatsappNumber}
            owner="negin"
            sourcePage="Negin Mohamadi Page"
            redirectBase={localizePath("/negin/ready-properties", locale)}
            redirectBaseByCategory={{
              all: localizePath("/negin/listings", locale),
              ready: localizePath("/negin/ready-properties", locale),
              "off-plan": localizePath("/negin/off-plan", locale),
              "resale-off-plan": localizePath("/negin/resale-off-plan", locale)
            }}
            intro={locale === "fa" ? "فرصت‌های منتخب نگین را جستجو کنید و سپس فهرست کامل را ببینید." : "Search curated opportunities with Negin, then continue to her full listings page."}
            locale={locale}
          />
        </section>

        <section className="section" id="featured">
          <SectionHeader eyebrow={t.featured.eyebrow} title={t.featured.title} text={t.featured.text} className="featured-section-header" />
          <div className="three-column-grid">
            {t.featured.cards.map((property) => (
              <PropertyCard key={property.title} card={property} cta={t.featured.whatsapp} locale={locale} />
            ))}
          </div>
        </section>

        <section className="section" id="projects">
          <SectionHeader eyebrow={t.projects.eyebrow} title={t.projects.title} text={t.projects.text} className="offplan-section-header" />
          <div className="three-column-grid projects-grid">
            {t.projects.cards.map((project) => (
              <ProjectCard key={project.title} card={project} />
            ))}
          </div>
        </section>

        <section className="section" id="areas">
          <SectionHeader eyebrow={t.areas.eyebrow} title={t.areas.title} text={t.areas.text} />
          <div className="stack-grid">
            {primeAreaCards.map((area) => (
              <AreaCard key={area.title} card={area} locale={locale} />
            ))}
          </div>
        </section>

        <section className="section section-advisory" id="advisory">
          <div className={`advisory-shell ${locale === "fa" ? "advisory-shell-fa" : "advisory-shell-en"}`}>
            <div className="advisory-copy">
              <h2>
                {t.advisory.titleLines[0]}
                <br />
                {t.advisory.titleLines[1]}
              </h2>
              <p className="advisory-intro">{t.advisory.intro}</p>
              <h3>{t.advisory.servicesTitle}</h3>
              <ul className="advisory-list">
                {t.advisory.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
              <a className="button advisory-button" href="#contact">
                {t.advisory.cta}
              </a>
            </div>
            <img className="advisory-photo" src="/negin-photo.svg" alt="Negin Mohamadi real estate advisory" />
          </div>
        </section>

        <section className="section partnership-section">
          <div className="partnership-note">
            <p className="section-eyebrow">{t.partnership.eyebrow}</p>
            <h2>{t.partnership.title}</h2>
            <p>{t.partnership.text}</p>
            <a href={localizePath("/", locale)}>
              {t.partnership.link}
            </a>
          </div>
        </section>

        <section className="section section-contact" id="contact">
          <SectionHeader eyebrow={t.contact.eyebrow} title={t.contact.title} text={t.contact.text} />

          <div className="consultation-panel">
            <form className="consultation-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  <span>{t.contact.labels.name}</span>
                  <input name="name" value={formData.name} onChange={handleChange} placeholder={t.contact.placeholders.name} />
                </label>
                <label>
                  <span>{t.contact.labels.email}</span>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder={t.contact.placeholders.email} />
                </label>
                <label>
                  <span>{t.contact.labels.phone}</span>
                  <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder={t.contact.placeholders.phone} />
                </label>
                <label>
                  <span>{t.contact.labels.purpose}</span>
                  <select name="purpose" value={formData.purpose} onChange={handleChange}>
                    {t.contact.purposes.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t.contact.labels.budget}</span>
                  <input name="budget" value={formData.budget} onChange={handleChange} placeholder={t.contact.placeholders.budget} />
                </label>
                <label>
                  <span>{t.contact.labels.area}</span>
                  <input name="area" value={formData.area} onChange={handleChange} placeholder={t.contact.placeholders.area} />
                </label>
              </div>

              <label className="full-width">
                <span>{t.contact.labels.message}</span>
                <textarea name="message" value={formData.message} onChange={handleChange} placeholder={t.contact.placeholders.message} rows={5}></textarea>
              </label>

              <button type="submit" className="button primary-button full-button">
                {t.contact.submit}
              </button>
            </form>

            <div className="contact-sidecards">
              <article className="contact-card">
                <h3>{t.contact.infoTitle}</h3>
                <div className="info-block">
                  <strong>{t.contact.addressTitle || (locale === "fa" ? "آدرس" : "Address")}</strong>
                  <p>{t.contact.address || "Unit 201, Building 11, Bay Square, Business Bay, Dubai, UAE"}</p>
                </div>
                <div className="info-block">
                  <strong>{t.contact.phoneTitle}</strong>
                  <p>+971 50 599 6547</p>
                </div>
              </article>

              <article className="contact-card">
                <h3>{t.contact.connectTitle}</h3>
                <div className="contact-buttons">
                  <a className="button whatsapp-button" href={`https://wa.me/${neginWhatsappNumber}`} target="_blank" rel="noopener noreferrer">
                    {t.contact.whatsapp}
                  </a>
                  <a className="button instagram-button" href={instagramUrl} target="_blank" rel="noopener noreferrer">
                    {t.contact.instagram}
                  </a>
                  <a className="button youtube-button" href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <YouTubeIcon />
                    {t.contact.youtube || (locale === "fa" ? "تماشا در یوتیوب" : "Watch on YouTube")}
                  </a>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>

      <a className="floating-whatsapp" href="https://wa.me/971505996547" target="_blank" rel="noopener noreferrer" aria-label="Open WhatsApp chat with Negin Mohamadi">
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16.04 3C8.88 3 3.06 8.82 3.06 15.98c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75a12.9 12.9 0 0 0 6.36 1.62h.01c7.16 0 12.98-5.82 12.98-12.98C29.03 8.82 23.2 3 16.04 3Zm0 23.66h-.01a10.76 10.76 0 0 1-5.48-1.5l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.74 10.74 0 0 1-1.65-5.73c0-5.89 4.8-10.68 10.7-10.68 2.85 0 5.53 1.11 7.55 3.13a10.61 10.61 0 0 1 3.12 7.55c0 5.89-4.8 10.68-10.69 10.68Zm5.86-8c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.72.16-.21.32-.82 1.05-1 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.77 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
    </main>
  );
}
