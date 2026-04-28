"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AreaPropertyFilters from "../components/AreaPropertyFilters";
import ProjectImage from "../components/ProjectImage";
import ResponsiveNavbar from "../components/ResponsiveNavbar";
import { getImageSrc } from "../lib/get-image-src";
import { localizePath } from "../lib/locale";
import { resolveProjectImage } from "../lib/project-images";

const whatsappNumber = "971522950316";
const instagramUrl = "https://instagram.com/";
const youtubeUrl = "https://www.youtube.com/@AliTaghavi";

const content = {
  en: {
    dir: "ltr",
    nav: {
      featured: "Ready Properties",
      projects: "Off-Plan Projects",
      resale: "Resale Off-Plan",
      areas: "Prime Areas",
      advisory: "About Me",
      negin: "Negin Mohamadi",
      contact: "Contact",
      toggle: "FA"
    },
    hero: {
      subtitle: "Curated by Ali Taghavi",
      title: "Exclusive Opportunities in Dubai's Prime Locations",
      titleLines: ["Exclusive Opportunities in", "Dubai's Prime Locations"],
      text: "Trusted by investors seeking high-value opportunities in Dubai's luxury market.",
      whatsapp: "WhatsApp Now",
      consultation: "Book Private Consultation"
    },
    featured: {
      eyebrow: "READY PROPERTIES",
      title: "Available Ready Properties for Living & Investment",
      text: "Curated ready homes across Dubai for end-users and investors",
      cta: "Explore Properties",
      moreOptions: "View All Areas →",
      cards: [
        {
          slug: "downtown",
          title: "Downtown",
          description: "Iconic city living with Burj Khalifa views, global demand, and proven rental appeal.",
          href: "/areas/downtown",
          imageClass: "area-one"
        },
        {
          slug: "palm-jumeirah",
          title: "Palm Jumeirah",
          description: "Dubai's signature waterfront address for branded residences, beach homes, and rare views.",
          href: "/areas/palm-jumeirah",
          imageClass: "featured-two"
        },
        {
          slug: "meydan",
          title: "Meydan",
          description: "A strategic growth district for villas, new luxury communities, and long-term upside.",
          href: "/areas/meydan",
          imageClass: "area-two"
        }
      ]
    },
    projects: {
      eyebrow: "Off-Plan Luxury Developments",
      title: "Premium off-plan projects worth watching",
      text: "Selected developments in Dubai's most prestigious branded and waterfront locations.",
      moreOptions: "Explore More Off-Plan Projects →",
      cards: [
        {
          brand: "OMNIYAT",
          title: "Alba Residences",
          description:
            "A signature ultra-luxury development redefining modern living through architectural excellence and exclusive design.",
          features: ["Developed by Omniyat", "Ultra-premium design", "Limited collection"],
          imageClass: "project-one"
        },
        {
          brand: "ARMANI BRANDED",
          title: "Armani Beach Residences",
          description:
            "Rare branded beachfront living combining Italian design excellence with Palm Jumeirah's prestige.",
          features: ["Branded interiors", "Beachfront location", "Ultra-luxury positioning"],
          imageClass: "project-two"
        },
        {
          brand: "WELLNESS INNOVATION",
          title: "EYWA",
          description:
            "Next-generation wellness residences combining luxury design with advanced health-focused technology.",
          features: ["Wellness concept", "Canal and skyline views", "Highly differentiated product"],
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
          slug: "downtown",
          title: "Downtown Dubai",
          description:
            "Downtown Dubai is the heart of the city and one of its most prestigious and high-demand locations. Home to Burj Khalifa, Dubai Mall, and world-class residences, it offers strong rental demand, high capital appreciation, and unmatched lifestyle value.",
          bullets: [
            "Iconic Burj Khalifa views",
            "High rental demand",
            "Prime central location",
            "Luxury lifestyle and amenities"
          ],
          imageClass: "area-one"
        },
        {
          slug: "palm-jumeirah",
          title: "Palm Jumeirah",
          description:
            "Palm Jumeirah is one of Dubai's most iconic waterfront destinations, known for branded residences, private beach access, and ultra-luxury living. It attracts both end-users and investors seeking prestige, lifestyle quality, and long-term value in one of the city's most recognizable addresses.",
          bullets: [
            "Iconic beachfront address",
            "Branded and luxury residences",
            "Strong lifestyle appeal",
            "High long-term prestige value"
          ],
          imageClass: "palm-area"
        },
        {
          slug: "meydan",
          title: "Meydan",
          description:
            "Meydan stands out for strategic growth, new infrastructure, and strong long-term upside. It appeals to investors who want to enter a prime district before the next wave of appreciation is fully priced in.",
          bullets: [
            "Growth corridor positioning",
            "Strong future infrastructure",
            "Investor-friendly entry point",
            "Large-format luxury communities"
          ],
          imageClass: "area-two"
        }
      ]
    },
    advisory: {
      eyebrow: "Advisory",
      title: "A trusted advisory approach, not a sales-driven one",
      headingLines: ["Investment Advisory with", "Ali Taghavi"],
      servicesTitle: "Services for Discerning Clients",
      text:
        "Ali Taghavi works as a strategic real estate advisor for clients who want clarity, honest guidance, and stronger decision support when entering Dubai's luxury market. The goal is not to push deals, but to help you identify and secure the right opportunity with confidence.",
      bullets: [
        "Experienced guidance from first conversation to final decision",
        "Clear market perspective built around your goals, timing, and risk profile",
        "Access to high-value resale and off-plan opportunities worth serious consideration",
        "Decision support, due diligence, and strategic thinking without pressure"
      ],
      cta: "Let's discuss your goals",
      imageClass: "advisory-image"
    },
    partnership: {
      eyebrow: "Working alongside Negin Mohamadi",
      title: "Working with a trusted team",
      text:
        "I work closely with Negin Mohamadi to give clients a more thoughtful, responsive, and well-rounded advisory experience while keeping the process personal, discreet, and boutique.",
      link: "Meet Negin Mohamadi"
    },
    testimonials: {
      eyebrow: "Client Perspective",
      title: "What discerning clients value most",
      items: [
        {
          quote:
            "Ali helped us focus only on the right opportunities. His guidance saved us time, improved our confidence, and led us to a property we would not have found on our own.",
          name: "Private Buyer",
          role: "Palm Jumeirah Purchase"
        },
        {
          quote:
            "What stood out was the clarity. Every option was explained with real pros, risks, and investment logic. It felt like strategic advisory, not a sales pitch.",
          name: "International Investor",
          role: "Resale Acquisition"
        },
        {
          quote:
            "Ali understood exactly what we wanted from a Dubai investment and guided us toward a better off-plan decision than we originally considered.",
          name: "Family Office Client",
          role: "Luxury Off-Plan Selection"
        }
      ]
    },
    contact: {
      eyebrow: "Request a Consultation",
      title: "Let's find the right opportunity for you",
      intro:
        "Tell me what you are looking for and I will help you evaluate the right path, whether that means an end-user home, a resale opportunity, or a strategic off-plan investment. For the fastest response, message me directly on WhatsApp.",
      infoTitle: "Contact Information",
      connectTitle: "Connect With Us",
      addressTitle: "Address",
      address: "Unit 201, Building 11, Bay Square, Business Bay, Dubai, UAE",
      phoneTitle: "Phone",
      youtube: "Watch on YouTube",
      whatsapp: "Contact via WhatsApp",
      instagram: "Follow on Instagram",
      submit: "Request Consultation",
      formLabels: {
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
        message: "Tell us about your investment goals..."
      },
      purposes: ["Investment", "Primary Residence"]
    }
  },
  fa: {
    dir: "rtl",
    nav: {
      featured: "لوکیشن های برتر",
      projects: "پروژه های لوکس",
      resale: "ری‌سیل آف‌پلن",
      areas: "مناطق برتر",
      advisory: "درباره من",
      contact: "ارتباط",
      toggle: "EN"
    },
    hero: {
      subtitle: "منتخب و هدایت شده توسط علی تقوی",
      title: "فرصت های خاص در بهترین لوکیشن های دبی",
      titleLines: ["فرصت های خاص در", "بهترین لوکیشن های دبی"],
      text: "یک همکاری مشاوره ای بوتیک برای خریداران و سرمایه گذارانی که به دنبال فرصت های ارزشمند در بازار لوکس دبی هستند.",
      whatsapp: "واتساپ",
      consultation: "رزرو مشاوره خصوصی"
    },
    featured: {
      eyebrow: "لوکیشن های برتر دبی",
      title: "منتخبی از املاک آماده برای زندگی و سرمایه‌گذاری در مناطق برتر دبی",
      text: "فرصت های منتخب را بر اساس مهم ترین مناطق و آدرس های دبی مرور کنید.",
      cta: "مشاهده املاک",
      moreOptions: "مشاهده همه مناطق ←",
      cards: [
        {
          slug: "downtown",
          title: "Downtown",
          description: "زندگی شهری شاخص با ویوی برج خلیفه، تقاضای جهانی و جذابیت اجاره ای قوی.",
          href: "/areas/downtown",
          imageClass: "area-one"
        },
        {
          slug: "palm-jumeirah",
          title: "Palm Jumeirah",
          description: "آدرس واترفرانت شاخص دبی برای رزیدنس های برندد، خانه های ساحلی و ویوهای کمیاب.",
          href: "/areas/palm-jumeirah",
          imageClass: "featured-two"
        },
        {
          slug: "meydan",
          title: "Meydan",
          description: "منطقه ای رو به رشد برای ویلاها، کامیونیتی های لوکس جدید و پتانسیل بلندمدت.",
          href: "/areas/meydan",
          imageClass: "area-two"
        }
      ]
    },
    projects: {
      eyebrow: "پروژه های لوکس آف پلن",
      title: "پروژه های پریمیوم آف پلن که ارزش بررسی دارند",
      text: "توسعه های منتخب در بهترین آدرس های برندد و واترفرانت دبی.",
      moreOptions: "مشاهده پروژه های آف پلن بیشتر ←",
      cards: [
        {
          brand: "امنیات",
          title: "Alba Residences",
          description:
            "پروژه‌ای شاخص و فوق‌لوکس که با معماری ممتاز و طراحی منحصربه‌فرد، تعریف تازه‌ای از زندگی مدرن ارائه می‌دهد.",
          features: ["توسعه‌یافته توسط امنیات", "طراحی فوق پریمیوم", "مجموعه‌ای محدود"],
          imageClass: "project-one"
        },
        {
          brand: "برند آرمانی",
          title: "Armani Beach Residences",
          description:
            "سبک زندگی ساحلی برندد و کم‌نظیر با تلفیق ظرافت طراحی ایتالیایی و پرستیژ پالم جمیرا.",
          features: ["فضاهای داخلی برندد", "موقعیت ساحلی", "جایگاه فوق‌لوکس"],
          imageClass: "project-two"
        },
        {
          brand: "نوآوری در سبک زندگی سلامت‌محور",
          title: "EYWA",
          description:
            "اقامتگاه‌های نسل جدید سلامت‌محور که طراحی لوکس را با فناوری پیشرفته متمرکز بر سلامتی ترکیب می‌کنند.",
          features: ["مفهوم سلامت‌محور", "چشم‌انداز کانال و خط آسمان شهر", "محصولی متمایز و منحصربه‌فرد"],
          imageClass: "project-three"
        }
      ]
    },
    areas: {
      eyebrow: "مناطق برتر دبی",
      title: "مناطقی که بیشتر به مشتریان پیشنهاد می کنیم",
      text: "لوکیشن هایی منتخب برای پرستیژ، کیفیت زندگی و پتانسیل سرمایه گذاری.",
      cards: [
        {
          slug: "downtown",
          title: "Downtown Dubai",
          description:
            "داون تاون دبی قلب شهر و یکی از معتبرترین و پرتقاضاترین مناطق است. حضور برج خلیفه، دبی مال و رزیدنس های سطح بالا باعث شده این منطقه هم برای سبک زندگی و هم برای سرمایه گذاری جایگاه بسیار قدرتمندی داشته باشد.",
          bullets: [
            "ویوی شاخص برج خلیفه",
            "تقاضای اجاره بالا",
            "لوکیشن مرکزی ممتاز",
            "سبک زندگی و امکانات لوکس"
          ],
          imageClass: "area-one"
        },
        {
          slug: "palm-jumeirah",
          title: "Palm Jumeirah",
          description:
            "Palm Jumeirah یکی از شاخص ترین مقصدهای واترفرانت دبی است که با رزیدنس های برندد، دسترسی به ساحل خصوصی و سبک زندگی فوق لوکس شناخته می شود. این منطقه هم برای مصرف کنندگان نهایی و هم برای سرمایه گذارانی جذاب است که به دنبال پرستیژ، کیفیت زندگی و ارزش بلندمدت در یکی از شناخته شده ترین آدرس های شهر هستند.",
          bullets: [
            "آدرس ساحلی شاخص",
            "رزیدنس های برندد و لوکس",
            "جذابیت قوی سبک زندگی",
            "ارزش پرستیژی بلندمدت"
          ],
          imageClass: "palm-area"
        },
        {
          slug: "meydan",
          title: "Meydan",
          description:
            "میدان برای رشد استراتژیک، زیرساخت های جدید و پتانسیل بازده بلندمدت شناخته می شود. این منطقه برای سرمایه گذارانی مناسب است که می خواهند قبل از موج بعدی رشد وارد یک ناحیه ممتاز شوند.",
          bullets: [
            "قرارگیری در کریدور رشد",
            "زیرساخت قوی آینده",
            "ورود مناسب برای سرمایه گذار",
            "کامیونیتی های بزرگ و لوکس"
          ],
          imageClass: "area-two"
        }
      ]
    },
    advisory: {
      eyebrow: "مشاوره",
      title: "مشاوره سرمایه‌گذاری با علی تقوی",
      headingLines: ["مشاوره سرمایه‌گذاری با", "علی تقوی"],
      servicesTitle: "خدمات برای مشتریان خاص",
      text:
        "علی تقوی به‌عنوان مشاور استراتژیک، در کنار مشتریانی قرار می‌گیرد که به‌دنبال شفافیت، راهنمایی صادقانه و پشتوانه‌ای مطمئن برای ورود به بازار لوکس دبی هستند.\nهدف فقط معرفی یک معامله نیست؛ هدف این است که به شما کمک شود فرصت مناسب را با دیدی روشن‌تر و اطمینان بیشتر شناسایی کنید و برای آن تصمیم بگیرید.",
      bullets: [
        "همراهی از اولین گفتگو تا تصمیم نهایی",
        "تحلیل بازار متناسب با هدف، زمان‌بندی و سطح ریسک شما",
        "دسترسی به فرصت‌های ارزشمند ری‌سیل و آف‌پلن",
        "پشتیبانی در تصمیم‌گیری با نگاه دقیق و بدون فشار"
      ],
      cta: "بیایید درباره اهدافتان صحبت کنیم",
      imageClass: "advisory-image"
    },
    partnership: {
      eyebrow: "همکاری در کنار نگین محمدی",
      title: "همراهی با یک تیم قابل اعتماد",
      text:
        "من در کنار نگین محمدی کار می کنم تا مشتریان تجربه ای دقیق تر، پاسخگوتر و کامل تر از مشاوره دریافت کنند؛ در عین حال روند همکاری شخصی، محرمانه و بوتیک باقی بماند.",
      link: "آشنایی با نگین محمدی"
    },
    testimonials: {
      eyebrow: "نظر مشتریان",
      title: "چیزی که مشتریان خاص بیشتر از همه ارزش می دانند",
      items: [
        {
          quote:
            "علی کمک کرد فقط روی فرصت های درست تمرکز کنیم. راهنمایی او هم در زمان ما صرفه جویی کرد و هم باعث شد با اطمینان بیشتری تصمیم بگیریم.",
          name: "خریدار خصوصی",
          role: "خرید در Palm Jumeirah"
        },
        {
          quote:
            "شفافیت در کار او فوق العاده بود. هر گزینه با مزایا، ریسک ها و منطق سرمایه گذاری توضیح داده می شد. حس مشاوره واقعی داشت، نه فروش.",
          name: "سرمایه گذار بین المللی",
          role: "خرید ریسل"
        },
        {
          quote:
            "علی دقیقا متوجه شد از سرمایه گذاری در دبی چه می خواهیم و ما را به سمت تصمیمی بهتر از گزینه اولیه مان هدایت کرد.",
          name: "مشتری Family Office",
          role: "انتخاب آف پلن لوکس"
        }
      ]
    },
    contact: {
      eyebrow: "درخواست مشاوره",
      title: "بیایید فرصت مناسب شما را پیدا کنیم",
      intro:
        "هدفتان را با من در میان بگذارید تا با هم مسیر درست را بررسی کنیم؛ چه برای خانه مصرفی، چه برای فرصت ریسل و چه برای یک سرمایه گذاری استراتژیک در آف پلن. برای سریع ترین پاسخ، مستقیم در واتساپ پیام بدهید.",
      infoTitle: "اطلاعات تماس",
      connectTitle: "ارتباط با ما",
      addressTitle: "آدرس",
      address: "واحد 201، ساختمان 11، Bay Square، بیزینس بی، دبی، امارات",
      phoneTitle: "شماره تماس",
      quickBrief: "ارسال سریع در واتساپ",
      whatsapp: "ارتباط از طریق واتساپ",
      instagram: "دنبال کردن در اینستاگرام",
      submit: "درخواست مشاوره",
      formLabels: {
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
        "سلام علی،",
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
          "Hello Ali,",
          "I came through your website.",
          `Name: ${values.name || "-"}`,
          `Phone: ${values.phone || "-"}`,
          `Email: ${values.email || "-"}`,
          `Purpose: ${values.purpose || "-"}`,
          `Budget: ${values.budget || "-"}`,
          `Preferred area: ${values.area || "-"}`,
          `Message: ${values.message || "-"}`
        ];

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function SectionHeader({ eyebrow, title, text, centered = true, dark = false, className = "" }) {
  return (
    <div className={`section-header ${centered ? "centered" : ""} ${dark ? "dark" : ""} ${className}`}>
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

function LocationCard({ card, cta, locale = "en" }) {
  const imageSrc = getImageSrc(card, "");
  return (
    <a className="listing-card location-card" href={card.href}>
      <div
        className={`listing-image ${card.imageClass || ""}`}
        style={imageSrc ? { backgroundImage: `url("${imageSrc}")` } : undefined}
      ></div>
      <div className="listing-content">
        <span className="listing-label">{locale === "fa" ? "منطقه برتر" : "Prime Area"}</span>
        <span className="listing-badge">{locale === "fa" ? "ناحیه دبی" : "Dubai District"}</span>
        <h3>{card.title}</h3>
        <p className="listing-description">{card.description}</p>
        <span className="button secondary-button location-card-button">{cta}</span>
      </div>
    </a>
  );
}

function ProjectCard({ card }) {
  const imageSrc = resolveProjectImage(card);
  return (
    <article className="project-card">
      <ProjectImage
        className={`project-image ${card.imageClass || ""} project-card-image`}
        src={imageSrc}
        alt={card.title || "Off-plan project"}
      />
      <div className="project-content">
        <p className="project-brand">{card.brand || card.developer}</p>
        <h3>{card.title}</h3>
        <p className="project-description">{card.description}</p>
        <ul className="feature-list">
          {card.features.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function localizeProjectCard(project, locale) {
  if (locale !== "fa") {
    return {
      ...project,
      brand: project.developer,
      features: Array.isArray(project.features) ? project.features : []
    };
  }

  const projectTranslations = {
    "alba-residences": {
      brand: "امنیات",
      description: "پروژه‌ای شاخص و فوق‌لوکس که با معماری ممتاز و طراحی منحصربه‌فرد، تعریف تازه‌ای از زندگی مدرن ارائه می‌دهد.",
      features: ["توسعه‌یافته توسط امنیات", "طراحی فوق پریمیوم", "مجموعه‌ای محدود"]
    },
    "armani-beach-residences": {
      brand: "برند آرمانی",
      description: "سبک زندگی ساحلی برندد و کم‌نظیر با تلفیق ظرافت طراحی ایتالیایی و پرستیژ پالم جمیرا.",
      features: ["فضاهای داخلی برندد", "موقعیت ساحلی", "جایگاه فوق‌لوکس"]
    },
    eywa: {
      brand: "نوآوری در سبک زندگی سلامت‌محور",
      description: "اقامتگاه‌های نسل جدید سلامت‌محور که طراحی لوکس را با فناوری پیشرفته متمرکز بر سلامتی ترکیب می‌کنند.",
      features: ["مفهوم سلامت‌محور", "چشم‌انداز کانال و خط آسمان شهر", "محصولی متمایز و منحصربه‌فرد"]
    }
  };
  const translated = projectTranslations[project.id] || {};

  return {
    ...project,
    brand: translated.brand || project.developer,
    description: translated.description || project.description,
    features: translated.features || (Array.isArray(project.features) ? project.features : [])
  };
}

function extractApiItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function AreaCard({ card, locale = "en" }) {
  const imageSrc = getImageSrc(card, "");
  return (
    <a className="area-card" href={localizePath(`/prime-areas/${card.slug}`, locale)}>
      <div
        className={`area-image ${card.imageClass || ""}`}
        style={imageSrc ? { backgroundImage: `url("${imageSrc}")` } : undefined}
      ></div>
      <div className="area-content">
        <h3>{card.title}</h3>
        {card.description ? <p>{card.description}</p> : null}
        {card.bullets.length ? (
          <ul className="feature-list">
            {card.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </a>
  );
}

function normalizeAreaKey(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const primeAreaFallbackContent = {
  downtown: {
    title: "Downtown Dubai",
    description: "Downtown Dubai is one of the city's most prestigious central districts, known for landmark views, premium residences, and strong lifestyle demand.",
    bullets: ["Burj Khalifa district", "Prime central location", "Luxury lifestyle appeal", "Strong end-user and investor demand"]
  },
  "palm-jumeirah": {
    title: "Palm Jumeirah",
    description: "Palm Jumeirah is Dubai's signature waterfront address, known for branded residences, private beach access, and long-term prestige value.",
    bullets: ["Iconic beachfront address", "Branded luxury residences", "High lifestyle appeal", "Long-term prestige value"]
  },
  bluewaters: {
    title: "Bluewaters",
    description: "Bluewaters is one of Dubai's most vibrant waterfront destinations, known for Ain Dubai, premium residences, and strong lifestyle appeal.",
    bullets: ["Waterfront lifestyle", "Ain Dubai landmark appeal", "Premium residences", "Strong leisure and lifestyle demand"]
  },
  meydan: {
    title: "Meydan",
    description: "Meydan is a strategic growth district with luxury communities, improving infrastructure, and strong long-term upside for buyers and investors.",
    bullets: ["Growth-led district", "Luxury communities", "Future infrastructure upside", "Family and investor appeal"]
  }
};

function normalizeAreaBullets(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4)
    .concat(fallback)
    .filter((item, index, items) => item && items.indexOf(item) === index)
    .slice(0, 4);
}

function buildPrimeAreaCards(managedAreas, fallbackCards, locale) {
  const fallbackBySlug = new Map(
    fallbackCards.flatMap((card) => {
      const keys = new Set([
        normalizeAreaKey(card.slug),
        normalizeAreaKey(card.title),
        normalizeAreaKey(card.id)
      ]);
      return [...keys].filter(Boolean).map((key) => [key, card]);
    })
  );
  const sourceCards = managedAreas.length ? managedAreas : fallbackCards;

  return sourceCards
    .map((area) => {
      const slug = area.slug || area.id || "";
      const normalizedKey =
        normalizeAreaKey(area.slug) ||
        normalizeAreaKey(area.area_name) ||
        normalizeAreaKey(area.name) ||
        normalizeAreaKey(area.id);
      const fallback = fallbackBySlug.get(normalizedKey) || {};
      const predefinedFallback = primeAreaFallbackContent[normalizedKey] || {};
      const title =
        area.overview_card_title ||
        area.short_title ||
        area.area_name ||
        area.name ||
        predefinedFallback.title ||
        fallback.title ||
        slug;
      const description =
        area.short_description ||
        area.note ||
        area.excerpt ||
        area.full_description ||
        area.lifestyle_text ||
        area.investment_analysis ||
        predefinedFallback.description ||
        fallback.description ||
        "";
      const bullets = normalizeAreaBullets(
        area.bullet_points || area.notes,
        predefinedFallback.bullets || fallback.bullets || []
      );

      if (process.env.NODE_ENV !== "production" && !description) {
        console.log("Missing content for:", area.slug || area.id || area.name);
      }

      return {
        slug: slug || normalizedKey,
        title,
        description,
        bullets,
        image_url: getImageSrc(area, getImageSrc(fallback, "")),
        imageClass: area.imageClass || fallback.imageClass || ""
      };
    })
    .map((area) => localizeAreaCard(area, locale));
}

function localizeAreaCard(area, locale) {
  if (locale !== "fa") return area;

  const translations = {
    "downtown": {
      title: "داون‌تاون دبی",
      description: "قلب شهری دبی با دسترسی ممتاز، تقاضای اجاره بالا و سبک زندگی لوکس در کنار برج خلیفه و دبی مال.",
      bullets: ["ویوی شاخص برج خلیفه", "تقاضای اجاره بالا", "موقعیت مرکزی ممتاز", "امکانات و سبک زندگی لوکس"]
    },
    "palm-jumeirah": {
      title: "پالم جمیرا",
      description: "یکی از نمادین‌ترین مقصدهای ساحلی دبی برای رزیدنس‌های برندد، دسترسی به ساحل خصوصی و زندگی فوق‌لوکس.",
      bullets: ["آدرس ساحلی شاخص", "رزیدنس‌های برندد و لوکس", "جذابیت قوی سبک زندگی", "ارزش پرستیژی بلندمدت"]
    },
    bluewaters: {
      title: "بلوواترز",
      description: "مقصدی واترفرانت و مدرن با ویوی دریا، سبک زندگی شاخص و رزیدنس‌های لوکس منتخب.",
      bullets: ["موقعیت واترفرانت", "ویوی دریا و عین دبی", "سبک زندگی ممتاز", "رزیدنس‌های لوکس منتخب"]
    },
    meydan: {
      title: "میدان",
      description: "منطقه‌ای رو به رشد با زیرساخت‌های جدید، کامیونیتی‌های لوکس و پتانسیل بلندمدت برای خریداران و سرمایه‌گذاران.",
      bullets: ["کریدور رشد آینده", "زیرساخت‌های در حال توسعه", "ورود مناسب برای سرمایه‌گذار", "کامیونیتی‌های لوکس بزرگ‌مقیاس"]
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

function AdvisorySection({ data, consultationLabel, locale }) {
  return (
    <section className="section section-advisory" id="advisory">
      <div className={`advisory-shell ${locale === "fa" ? "advisory-shell-fa" : "advisory-shell-en"}`}>
        <div className="advisory-copy">
          <h2>
            {data.headingLines[0]}
            <br />
            <span className="nowrap-name">{data.headingLines[1]}</span>
          </h2>
          <p className="advisory-intro">{data.text}</p>
        <h3>{data.servicesTitle}</h3>
          <ul className="advisory-list">
            {data.bullets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <a className="button advisory-button" href="#contact">
            {consultationLabel}
          </a>
        </div>
        <img className="advisory-photo" src="/ali-photo.png" alt="Ali Taghavi" />
      </div>
    </section>
  );
}

export default function HomePage() {
  const pathname = usePathname();
  const [locale, setLocale] = useState(pathname?.startsWith("/fa") ? "fa" : "en");
  const [editableAreas, setEditableAreas] = useState([]);
  const [offPlanProjects, setOffPlanProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    purpose: "Investment",
    budget: "",
    area: "",
    message: ""
  });

  const t = content[locale];
  const areaImageMap = new Map(editableAreas.map((area) => [area.slug || area.id, getImageSrc(area, "")]));
  const featuredCards = t.featured.cards.map((card) => ({
    ...card,
    href: localizePath(card.href || "/", locale),
    image_url: areaImageMap.get(card.slug),
    imageClass: card.slug ? "" : card.imageClass
  }));
  const managedPrimeAreas = editableAreas
    .filter((area) => area.active !== false && area.featured !== false)
    .sort((left, right) => (left.display_order || 0) - (right.display_order || 0));
  const fallbackPrimeAreaCards = t.areas.cards.map((card) => ({
    ...card,
    image_url: areaImageMap.get(card.slug) || getImageSrc(card, ""),
    imageClass: card.slug ? "" : card.imageClass
  }));
  const primeAreaCards = buildPrimeAreaCards(managedPrimeAreas, fallbackPrimeAreaCards, locale);
  const projectCards = offPlanProjects.map((project) => localizeProjectCard(project, locale));
  const navLinks = [
    { href: localizePath("/ready-properties", locale), label: t.nav.featured },
    { href: localizePath("/off-plan-projects", locale), label: t.nav.projects },
    { href: localizePath("/resale-off-plan", locale), label: t.nav.resale },
    { href: localizePath("/#areas", locale), label: t.nav.areas },
    { href: localizePath("/negin", locale), label: t.nav.negin || "Negin Mohamadi" },
    { href: localizePath("/#contact", locale), label: t.nav.contact },
    { href: localizePath("/#advisory", locale), label: t.nav.advisory }
  ];

  useEffect(() => {
    setLocale(pathname?.startsWith("/fa") ? "fa" : "en");
  }, [pathname]);

  useEffect(() => {
    document.documentElement.lang = locale === "fa" ? "fa" : "en";
    document.documentElement.dir = t.dir;
  }, [locale, t.dir]);

  useEffect(() => {
    fetch("/api/areas?owner=ali")
      .then((response) => response.json())
      .then((areas) => setEditableAreas(extractApiItems(areas)))
      .catch(() => setEditableAreas([]));
  }, []);

  useEffect(() => {
    fetch("/api/projects?featured=true&owner=ali")
      .then((response) => response.json())
      .then((projects) => setOffPlanProjects(extractApiItems(projects)))
      .catch(() => setOffPlanProjects([]));
  }, []);

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      purpose: content[locale].contact.purposes[0]
    }));
  }, [locale]);

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
      <ResponsiveNavbar
        brandLabel="Ali Taghavi"
        brandHref={localizePath("/#home", locale)}
        links={navLinks}
        locale={locale}
      />

      <section className="hero-section" id="home">
        <div className="hero-overlay"></div>
        <div className="hero-inner">
          <p className="hero-kicker">{t.hero.subtitle}</p>
          <h1>
            {t.hero.titleLines[0]}
            <br />
            {t.hero.titleLines[1]}
          </h1>
          <p className="hero-description">{t.hero.text}</p>
          <div className="hero-actions">
            <a className="button whatsapp-button" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
              {t.hero.whatsapp}
            </a>
            <a className="button ghost-button" href={localizePath("/#contact", locale)}>
              {t.hero.consultation}
            </a>
          </div>
        </div>
      </section>

      <div className="content-shell">
        <section className="section homepage-search-section">
          <SectionHeader
            eyebrow={locale === "fa" ? "جستجوی ملک" : "Property Search"}
            title={locale === "fa" ? "فرصت مناسب در دبی را پیدا کنید" : "Find the right Dubai opportunity"}
            text={locale === "fa" ? "بر اساس منطقه، ساختمان، تعداد خواب، بودجه و وضعیت آماده یا آف‌پلن جستجو کنید." : "Search by area, building, bedrooms, price, and ready or off-plan status."}
            className="homepage-search-header"
          />
          <AreaPropertyFilters
            mode="redirect"
            areaName="Dubai"
            redirectBase={localizePath("/ready-properties", locale)}
            redirectBaseByCategory={{
              all: localizePath("/listings", locale),
              ready: localizePath("/ready-properties", locale),
              "off-plan": localizePath("/off-plan-projects", locale),
              "resale-off-plan": localizePath("/resale-off-plan", locale)
            }}
            intro={locale === "fa" ? "در میان فرصت‌های آماده و آف‌پلن منتخب جستجو کنید و سپس فهرست کامل را ببینید." : "Search across curated ready and off-plan opportunities, then continue to the full listings page."}
            locale={locale}
          />
        </section>

        <section className="section" id="featured">
          <SectionHeader
            eyebrow={t.featured.eyebrow}
            title={t.featured.title}
            text={t.featured.text}
            className="featured-section-header"
          />
          <div className="three-column-grid">
            {featuredCards.map((card) => (
              <LocationCard key={card.title} card={card} cta={t.featured.cta} locale={locale} />
            ))}
          </div>
          <div className="more-options-row">
            <a className="button secondary-button more-options-button" href={localizePath("/ready-properties", locale)}>
              {t.featured.moreOptions || (locale === "fa" ? "مشاهده فرصت‌های بیشتر ←" : "Explore More Opportunities →")}
            </a>
          </div>
        </section>

        <section className="section" id="projects">
          <SectionHeader
            eyebrow={t.projects.eyebrow}
            title={t.projects.title}
            text={t.projects.text}
            className="offplan-section-header"
          />
          <div className="three-column-grid projects-grid">
            {projectCards.map((card) => (
              <ProjectCard key={card.title} card={card} />
            ))}
          </div>
          <div className="offplan-more-row">
            <a className="offplan-more-button" href={localizePath("/off-plan-projects", locale)}>
              {t.projects.moreOptions}
            </a>
          </div>
        </section>

        <section className="section" id="areas">
          <SectionHeader eyebrow={t.areas.eyebrow} title={t.areas.title} text={t.areas.text} />
          <div className="stack-grid">
            {primeAreaCards.map((card) => (
              <AreaCard key={card.title} card={card} locale={locale} />
            ))}
          </div>
        </section>

        <AdvisorySection data={t.advisory} consultationLabel={t.advisory.cta} locale={locale} />

        <section className="section partnership-section">
          <div className="partnership-note">
            <p className="section-eyebrow">{t.partnership.eyebrow}</p>
            <h2>{t.partnership.title}</h2>
            <p>{t.partnership.text}</p>
            <a href={localizePath("/negin", locale)}>
              {t.partnership.link}
            </a>
          </div>
        </section>

        <section className="section section-testimonials">
          <SectionHeader
            eyebrow={t.testimonials.eyebrow}
            title={t.testimonials.title}
          />
          <div className="three-column-grid testimonial-grid">
            {t.testimonials.items.map((item) => (
              <article className="testimonial-card" key={item.name + item.role}>
                <p className="testimonial-quote">"{item.quote}"</p>
                <div className="testimonial-meta">
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-contact" id="contact">
          <SectionHeader eyebrow={t.contact.eyebrow} title={t.contact.title} text={t.contact.intro} />

          <div className="consultation-panel">
            <form className="consultation-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  <span>{t.contact.formLabels.name}</span>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t.contact.placeholders.name}
                  />
                </label>
                <label>
                  <span>{t.contact.formLabels.email}</span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t.contact.placeholders.email}
                  />
                </label>
                <label>
                  <span>{t.contact.formLabels.phone}</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t.contact.placeholders.phone}
                  />
                </label>
                <label>
                  <span>{t.contact.formLabels.purpose}</span>
                  <select name="purpose" value={formData.purpose} onChange={handleChange}>
                    {t.contact.purposes.map((purpose) => (
                      <option key={purpose} value={purpose}>
                        {purpose}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t.contact.formLabels.budget}</span>
                  <input
                    type="text"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder={t.contact.placeholders.budget}
                  />
                </label>
                <label>
                  <span>{t.contact.formLabels.area}</span>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder={t.contact.placeholders.area}
                  />
                </label>
              </div>

              <label className="full-width">
                <span>{t.contact.formLabels.message}</span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t.contact.placeholders.message}
                  rows={5}
                ></textarea>
              </label>

              <button type="submit" className="button primary-button full-button">
                {t.contact.submit}
              </button>
            </form>

            <div className="contact-sidecards">
              <article className="contact-card">
                <h3>{t.contact.infoTitle}</h3>
                <div className="info-block">
                  <strong>{t.contact.addressTitle}</strong>
                  <p>{t.contact.address}</p>
                </div>
                <div className="info-block">
                  <strong>{t.contact.phoneTitle}</strong>
                  <p>+971 52 295 0316</p>
                </div>
              </article>

              <article className="contact-card">
                <h3>{t.contact.connectTitle}</h3>
                <div className="contact-buttons">
                  <a className="button whatsapp-button" href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer">
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
      <a
        className="floating-whatsapp"
        href="https://wa.me/971522950316"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open WhatsApp chat with Ali Taghavi"
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
          <path d="M16.04 3C8.88 3 3.06 8.82 3.06 15.98c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75a12.9 12.9 0 0 0 6.36 1.62h.01c7.16 0 12.98-5.82 12.98-12.98C29.03 8.82 23.2 3 16.04 3Zm0 23.66h-.01a10.76 10.76 0 0 1-5.48-1.5l-.39-.23-3.96 1.04 1.06-3.86-.25-.4a10.74 10.74 0 0 1-1.65-5.73c0-5.89 4.8-10.68 10.7-10.68 2.85 0 5.53 1.11 7.55 3.13a10.61 10.61 0 0 1 3.12 7.55c0 5.89-4.8 10.68-10.69 10.68Zm5.86-8c-.32-.16-1.9-.94-2.2-1.05-.29-.11-.5-.16-.72.16-.21.32-.82 1.05-1 1.26-.18.21-.37.24-.69.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.91-1.79-2.23-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.48 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.77 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </a>
    </main>
  );
}
