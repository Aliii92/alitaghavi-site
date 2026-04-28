"use client";

import { useMemo, useState } from "react";
import AreaPropertyCard from "./AreaPropertyCard";
import { getImageSrc } from "../lib/get-image-src.js";

const copyByLocale = {
  en: {
    label: "Region",
    propertiesAvailable: (count) => `${count} properties available`,
    viewMore: "View more",
    showLess: "Show less",
    noRegions: "No regions currently meet the listing threshold."
  },
  fa: {
    label: "منطقه",
    propertiesAvailable: (count) => `${count} ملک موجود`,
    viewMore: "مشاهده بیشتر",
    showLess: "نمایش کمتر",
    noRegions: "در حال حاضر منطقه‌ای با حداقل تعداد ملک موجود نیست."
  }
};

function regionNameForProperty(property) {
  return String(
    property?.area ||
      property?.region ||
      property?.location ||
      property?.community ||
      property?.project_location ||
      "Other Areas"
  ).trim() || "Other Areas";
}

function slugifyRegion(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "other-areas";
}

export default function RegionGroupedListings({
  properties = [],
  advisorName = "Ali Taghavi",
  areaName = "Dubai",
  sourcePage = "",
  phoneNumber = "971522950316",
  owner = "ali",
  locale = "en",
  minimumProperties = 3,
  initialVisible = 3
}) {
  const copy = copyByLocale[locale === "fa" ? "fa" : "en"];
  const [expandedRegions, setExpandedRegions] = useState({});

  const regionGroups = useMemo(() => {
    const byRegion = new Map();

    properties.forEach((property) => {
      const name = regionNameForProperty(property);
      const slug = slugifyRegion(name);

      if (!byRegion.has(slug)) {
        byRegion.set(slug, {
          slug,
          name,
          items: [],
          imageSrc: getImageSrc(property, "/dubai-hero.png")
        });
      }

      byRegion.get(slug).items.push(property);
    });

    return [...byRegion.values()]
      .filter((group) => group.items.length >= minimumProperties)
      .sort((left, right) => right.items.length - left.items.length || left.name.localeCompare(right.name));
  }, [minimumProperties, properties]);

  if (!regionGroups.length) {
    return (
      <article className="contact-card empty-listings-card">
        <h3>{copy.noRegions}</h3>
      </article>
    );
  }

  return (
    <div className="area-building-groups region-grouped-listings">
      {regionGroups.map((group) => {
        const expanded = Boolean(expandedRegions[group.slug]);
        const visibleItems = expanded ? group.items : group.items.slice(0, initialVisible);
        const hasMore = group.items.length > initialVisible;

        return (
          <section className="building-listing-group region-listing-group" id={`region-${group.slug}`} key={group.slug}>
            <div
              className="building-group-header region-group-header"
              style={{ backgroundImage: `linear-gradient(135deg, rgba(9, 15, 25, 0.84), rgba(9, 15, 25, 0.58)), url("${group.imageSrc}")` }}
            >
              <p className="section-eyebrow">{copy.label}</p>
              <h3>{group.name}</h3>
              <span>{copy.propertiesAvailable(group.items.length)}</span>
            </div>

            <div className="three-column-grid all-listings-grid">
              {visibleItems.map((property) => (
                <AreaPropertyCard
                  key={property.id}
                  property={property}
                  areaName={areaName}
                  advisorName={advisorName}
                  sourcePage={sourcePage}
                  phoneNumber={phoneNumber}
                  owner={owner}
                  locale={locale}
                />
              ))}
            </div>

            {hasMore ? (
              <div className="more-units-row">
                <button
                  type="button"
                  className="button secondary-button more-units-button"
                  onClick={() =>
                    setExpandedRegions((current) => ({
                      ...current,
                      [group.slug]: !expanded
                    }))
                  }
                >
                  {expanded ? copy.showLess : copy.viewMore}
                </button>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
