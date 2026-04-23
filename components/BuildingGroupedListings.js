"use client";

import { useMemo, useState } from "react";
import AreaPropertyCard from "./AreaPropertyCard";

const groupCopy = {
  en: {
    browse: "Browse by Building",
    jump: "Jump to a project",
    searchLabel: "Search building",
    searchPlaceholder: "Search building...",
    noBuildings: "No buildings match this search.",
    buildingProject: "Building / Project",
    unitsAvailable: (count) => `${count} units available`,
    showLess: "Show less",
    moreUnits: "More units"
  },
  fa: {
    browse: "مرور بر اساس ساختمان",
    jump: "انتخاب سریع پروژه",
    searchLabel: "جستجوی ساختمان",
    searchPlaceholder: "جستجوی ساختمان...",
    noBuildings: "ساختمانی با این جستجو پیدا نشد.",
    buildingProject: "ساختمان / پروژه",
    unitsAvailable: (count) => `${count} واحد موجود`,
    showLess: "نمایش کمتر",
    moreUnits: "واحدهای بیشتر"
  }
};

function buildingSlug(value) {
  return String(value || "building")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function BuildingGroupedListings({
  properties = [],
  areaName = "Dubai",
  advisorName = "Ali Taghavi",
  sourcePage = "",
  phoneNumber = "971522950316",
  owner = "ali",
  initialVisiblePerGroup = 3,
  locale = "en"
}) {
  const copy = groupCopy[locale === "fa" ? "fa" : "en"];
  const [expandedGroups, setExpandedGroups] = useState({});
  const [buildingSearch, setBuildingSearch] = useState("");
  const groupedProperties = useMemo(() => {
    const groups = [];
    const byBuilding = new Map();

    properties.forEach((property) => {
      const building = property.building || property.project || areaName;
      if (!byBuilding.has(building)) {
        const group = { building, slug: buildingSlug(building), items: [] };
        byBuilding.set(building, group);
        groups.push(group);
      }

      byBuilding.get(building).items.push(property);
    });

    return groups;
  }, [areaName, properties]);
  const visibleNavigatorGroups = useMemo(() => {
    const query = buildingSearch.trim().toLowerCase();
    if (!query) return groupedProperties;
    return groupedProperties.filter((group) => group.building.toLowerCase().includes(query));
  }, [buildingSearch, groupedProperties]);

  return (
    <div className="area-building-groups">
      {groupedProperties.length ? (
        <nav className="building-navigator" aria-label={`Buildings in ${areaName}`}>
          <div className="building-navigator-header">
            <p className="section-eyebrow">{copy.browse}</p>
            <h3>{copy.jump}</h3>
          </div>
          <label className="building-navigator-search">
            <span>{copy.searchLabel}</span>
            <input
              type="search"
              value={buildingSearch}
              onChange={(event) => setBuildingSearch(event.target.value)}
              placeholder={copy.searchPlaceholder}
            />
          </label>
          <div className="building-navigator-list">
            {visibleNavigatorGroups.map((group) => (
              <a className="building-navigator-chip" href={`#building-${group.slug}`} key={group.building}>
                <span>{group.building}</span>
                <strong>{group.items.length}</strong>
              </a>
            ))}
            {!visibleNavigatorGroups.length ? (
              <p className="building-navigator-empty">{copy.noBuildings}</p>
            ) : null}
          </div>
        </nav>
      ) : null}

      {groupedProperties.map((group) => {
        const expanded = Boolean(expandedGroups[group.building]);
        const visibleItems = expanded ? group.items : group.items.slice(0, initialVisiblePerGroup);
        const hasMoreUnits = group.items.length > initialVisiblePerGroup;

        return (
          <section className="building-listing-group" id={`building-${group.slug}`} key={group.building}>
            <div className="building-group-header">
              <p className="section-eyebrow">{copy.buildingProject}</p>
              <h3>{group.building}</h3>
              <span>{copy.unitsAvailable(group.items.length)}</span>
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
            {hasMoreUnits ? (
              <div className="more-units-row">
                <button
                  type="button"
                  className="button secondary-button more-units-button"
                  onClick={() =>
                    setExpandedGroups((current) => ({
                      ...current,
                      [group.building]: !expanded
                    }))
                  }
                >
                  {expanded ? copy.showLess : copy.moreUnits}
                </button>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
