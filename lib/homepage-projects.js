export function localizeHomepageProjectCard(project, locale = "en") {
  if (locale !== "fa") {
    return {
      ...project,
      brand: project.brand || project.developer,
      features: Array.isArray(project.features) ? project.features : []
    };
  }

  const projectTranslations = {
    "alba-residences": {
      brand: "امنیات",
      description:
        "پروژه‌ای شاخص و فوق‌لوکس که با معماری ممتاز و طراحی منحصربه‌فرد، تعریف تازه‌ای از زندگی مدرن ارائه می‌دهد.",
      features: ["توسعه‌یافته توسط امنیات", "طراحی فوق پریمیوم", "مجموعه‌ای محدود"]
    },
    "armani-beach-residences": {
      brand: "برند آرمانی",
      description:
        "سبک زندگی ساحلی برندد و کم‌نظیر با تلفیق ظرافت طراحی ایتالیایی و پرستیژ پالم جمیرا.",
      features: ["فضاهای داخلی برندد", "موقعیت ساحلی", "جایگاه فوق‌لوکس"]
    },
    eywa: {
      brand: "نوآوری در سبک زندگی سلامت‌محور",
      description:
        "اقامتگاه‌های نسل جدید سلامت‌محور که طراحی لوکس را با فناوری پیشرفته متمرکز بر سلامتی ترکیب می‌کنند.",
      features: ["مفهوم سلامت‌محور", "چشم‌انداز کانال و خط آسمان شهر", "محصولی متمایز و منحصربه‌فرد"]
    }
  };

  const translated = projectTranslations[project.id] || {};

  return {
    ...project,
    brand: translated.brand || project.brand || project.developer,
    description: translated.description || project.description,
    features: translated.features || (Array.isArray(project.features) ? project.features : [])
  };
}
