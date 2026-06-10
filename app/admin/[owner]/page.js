"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { formatPriceDisplay } from "../../../lib/price";

const advisorConfig = {
  ali: { label: "Ali Taghavi", siteUrl: "/", storageKey: "ali_admin_password" }
};

const emptyProperty = {
  id: "",
  title: "",
  area: "",
  building: "",
  category: "ready",
  property_type: "apartment",
  bedrooms: "",
  size: "",
  price: "",
  view: "",
  furnishing: "",
  status: "Available",
  short_description: "",
  notes: "",
  image_url: "",
  featured: false,
  whatsapp_link: ""
};

function slugify(value) {
  return String(value || "property")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function groupName(value, fallback) {
  return String(value || "").trim() || fallback;
}

async function parseApiResponse(response) {
  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error ||
      raw ||
      (response.status === 401 ? "Invalid password." : `Request failed with status ${response.status}.`);
    throw new Error(message);
  }

  return data;
}

function extractItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function extractImageUrl(data) {
  return data?.image_url || data?.item?.image_url || "";
}

export default function ScopedAdminPage() {
  const { owner } = useParams();
  const pathname = usePathname();
  const config = advisorConfig[owner] || advisorConfig.ali;
  const basePath = `/admin/${owner}`;
  const inventoryScope = pathname?.includes("/resale-off-plan") ? "resale-off-plan" : "standard";
  const isResaleScope = inventoryScope === "resale-off-plan";
  const pageTitle = isResaleScope ? "Resale Off-Plan Listings" : "Property Listings";
  const pageDescription = isResaleScope
    ? `Manage only ${config.label} resale off-plan listings and contact flow.`
    : `Manage only ${config.label} listings, featured properties, and inquiry flow.`;
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [properties, setProperties] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProperty);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminSearch, setAdminSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState(isResaleScope ? "resale-off-plan" : "all");
  const [expandedAreas, setExpandedAreas] = useState({});
  const [expandedBuildings, setExpandedBuildings] = useState({});

  useEffect(() => {
    setCategoryFilter(isResaleScope ? "resale-off-plan" : "all");
  }, [isResaleScope]);

  const scopedProperties = useMemo(
    () =>
      properties.filter((property) => {
        if (inventoryScope === "resale-off-plan") return property.category === "resale-off-plan";
        return property.category !== "resale-off-plan";
      }),
    [inventoryScope, properties]
  );
  const featuredCount = useMemo(() => scopedProperties.filter((property) => property.featured).length, [scopedProperties]);
  const categoryOptions = useMemo(
    () => [...new Set(scopedProperties.map((property) => property.category).filter(Boolean))].sort(),
    [scopedProperties]
  );
  const areaOptions = useMemo(
    () => [...new Set(scopedProperties.map((property) => groupName(property.area, "Other Areas")))].sort(),
    [scopedProperties]
  );
  const buildingOptions = useMemo(
    () =>
      [
        ...new Set(
          scopedProperties
            .filter((property) => areaFilter === "all" || groupName(property.area, "Other Areas") === areaFilter)
            .map((property) => groupName(property.building, "Unassigned Building"))
        )
      ].sort(),
    [areaFilter, scopedProperties]
  );
  const filteredProperties = useMemo(() => {
    const normalizedSearch = adminSearch.trim().toLowerCase();

    return scopedProperties.filter((property) => {
      const area = groupName(property.area, "Other Areas");
      const building = groupName(property.building, "Unassigned Building");
      const matchesArea = areaFilter === "all" || area === areaFilter;
      const matchesBuilding = buildingFilter === "all" || building === buildingFilter;
      const matchesCategory = categoryFilter === "all" || property.category === categoryFilter;
      const searchable = [
        property.title,
        property.area,
        property.building,
        property.price,
        property.view,
        property.status,
        property.category,
        property.property_type,
        property.bedrooms,
        property.id
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);

      return matchesArea && matchesBuilding && matchesCategory && matchesSearch;
    });
  }, [adminSearch, areaFilter, buildingFilter, categoryFilter, scopedProperties]);
  const groupedProperties = useMemo(() => {
    const areas = [];
    const byArea = new Map();

    filteredProperties.forEach((property) => {
      const area = groupName(property.area, "Other Areas");
      const building = groupName(property.building, "Unassigned Building");

      if (!byArea.has(area)) {
        const areaGroup = { name: area, total: 0, buildings: [], byBuilding: new Map() };
        byArea.set(area, areaGroup);
        areas.push(areaGroup);
      }

      const areaGroup = byArea.get(area);
      areaGroup.total += 1;

      if (!areaGroup.byBuilding.has(building)) {
        const buildingGroup = { name: building, units: [] };
        areaGroup.byBuilding.set(building, buildingGroup);
        areaGroup.buildings.push(buildingGroup);
      }

      areaGroup.byBuilding.get(building).units.push(property);
    });

    return areas
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((area) => ({
        ...area,
        buildings: area.buildings.sort((left, right) => left.name.localeCompare(right.name))
      }));
  }, [filteredProperties]);

  useEffect(() => {
    const saved = window.localStorage.getItem(config.storageKey) || "";
    if (saved) {
      setStoredPassword(saved);
      loadProperties(saved);
    }
  }, [config.storageKey, inventoryScope]);

  async function loadProperties(authPassword = storedPassword) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/properties?admin=true&inventoryType=${encodeURIComponent(inventoryScope)}`, {
        headers: authPassword ? { "x-admin-password": authPassword } : {}
      });
      const data = await parseApiResponse(response);

      setProperties(extractItems(data));
      return true;
    } catch (error) {
      setMessage(error.message || "Could not load properties.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const ok = await loadProperties(password);

    if (ok) {
      window.localStorage.setItem(config.storageKey, password);
      setStoredPassword(password);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(config.storageKey);
    setStoredPassword("");
    setPassword("");
    setProperties([]);
  }

  function startCreate(context = {}) {
    setEditing("new");
    setForm({
      ...emptyProperty,
      id: `property-${Date.now()}`,
      area: context.area || "",
      building: context.building || "",
      category: context.category || (isResaleScope ? "resale-off-plan" : emptyProperty.category)
    });
    setImageFile(null);
    setImagePreview("");
    setMessage("");
  }

  function startEdit(property) {
    setEditing(property.id);
    setForm(property);
    setImageFile(null);
    setImagePreview(property.image_url || "");
    setMessage("");
  }

  function cancelEditing() {
    setEditing(null);
    setForm(emptyProperty);
    setImageFile(null);
    setImagePreview("");
  }

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));

    if (name === "image_url" && !imageFile) setImagePreview(value);
  }

  function autoId() {
    setForm((current) => ({
      ...current,
      id: `${slugify(current.building || current.area || current.title)}-${Date.now()}`
    }));
  }

  function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview("");
    setForm((current) => ({ ...current, image_url: "" }));
  }

  async function uploadImageIfNeeded(propertyId) {
    if (!imageFile) return form.image_url;

    const uploadData = new FormData();
    uploadData.append("image", imageFile);
    uploadData.append("propertyId", propertyId || form.id);

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "x-admin-password": storedPassword },
      body: uploadData
    });
    const data = await parseApiResponse(response);
    return extractImageUrl(data);
  }

  async function saveProperty(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const imageUrl = await uploadImageIfNeeded(form.id);
      const response = await fetch("/api/properties", {
        method: editing === "new" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword
        },
        body: JSON.stringify({ ...form, image_url: imageUrl })
      });
      await parseApiResponse(response);

      await loadProperties();
      setEditing(null);
      setForm(emptyProperty);
      setImageFile(null);
      setImagePreview("");
      setMessage("Property saved successfully.");
    } catch (error) {
      setMessage(error.message || "Could not save property.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProperty(property) {
    if (!window.confirm(`Delete "${property.title}"?`)) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/properties?id=${encodeURIComponent(property.id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": storedPassword }
      });
      await parseApiResponse(response);

      await loadProperties();
      setMessage("Property deleted.");
    } catch (error) {
      setMessage(error.message || "Could not delete property.");
    } finally {
      setLoading(false);
    }
  }

  function toggleArea(area) {
    setExpandedAreas((current) => ({ ...current, [area]: !current[area] }));
  }

  function toggleBuilding(area, building) {
    const key = `${area}::${building}`;
    setExpandedBuildings((current) => ({ ...current, [key]: !current[key] }));
  }

  function resetAdminFilters() {
    setAdminSearch("");
    setAreaFilter("all");
    setBuildingFilter("all");
    setCategoryFilter(isResaleScope ? "resale-off-plan" : "all");
  }

  function renderPropertyForm({ inline = false } = {}) {
    return (
      <section className={inline ? "admin-form-panel admin-inline-edit-panel" : "admin-form-panel"}>
        <div className="admin-form-header">
          <h2>{editing === "new" ? "Add Property" : "Edit Property"}</h2>
          <button className="button secondary-button" type="button" onClick={cancelEditing}>
            Cancel
          </button>
        </div>

        <form onSubmit={saveProperty} className="admin-property-form">
          <label>
            <span>ID</span>
            <div className="admin-inline-field">
              <input name="id" value={form.id} onChange={handleChange} required />
              <button className="button secondary-button" type="button" onClick={autoId}>
                Auto
              </button>
            </div>
          </label>

          {["title", "area", "building", "bedrooms", "size", "price", "view", "furnishing", "status", "image_url", "whatsapp_link"].map((field) => (
            <label key={field}>
              <span>{field.replace(/_/g, " ")}</span>
              <input name={field} value={form[field] || ""} onChange={handleChange} required={["title", "area", "building", "price"].includes(field)} />
            </label>
          ))}

          <div className="admin-image-uploader">
            <div>
              <span>Property Image Upload</span>
              <p>Upload JPG, PNG, or WEBP directly from your computer.</p>
            </div>
            {imagePreview ? (
              <img className="admin-image-preview" src={imagePreview} alt="Property preview" />
            ) : (
              <div className="admin-image-placeholder">No image selected</div>
            )}
            <div className="admin-upload-actions">
              <label className="button primary-button admin-upload-button">
                {form.image_url || imageFile ? "Replace Image" : "Upload Image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} />
              </label>
              <button className="button secondary-button" type="button" onClick={removeImage}>
                Remove Image
              </button>
            </div>
          </div>

          <label>
            <span>Inventory Type</span>
            <select name="category" value={form.category} onChange={handleChange}>
              {isResaleScope ? (
                <option value="resale-off-plan">Resale Off-Plan</option>
              ) : (
                <>
                  <option value="ready">Ready</option>
                  <option value="off-plan">Off-plan</option>
                </>
              )}
            </select>
          </label>

          <label>
            <span>Property Type</span>
            <select name="property_type" value={form.property_type} onChange={handleChange}>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="penthouse">Penthouse</option>
            </select>
          </label>

          <label className="admin-wide-field">
            <span>Short Description</span>
            <textarea name="short_description" value={form.short_description || ""} onChange={handleChange} rows={3} />
          </label>

          <label className="admin-wide-field">
            <span>Notes</span>
            <textarea name="notes" value={form.notes || ""} onChange={handleChange} rows={3} />
          </label>

          <label className="admin-checkbox-field">
            <input type="checkbox" name="featured" checked={Boolean(form.featured)} onChange={handleChange} />
            <span>Show as featured for {config.label}</span>
          </label>

          <button className="button primary-button admin-save-button" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Property"}
          </button>
        </form>
      </section>
    );
  }

  if (!storedPassword) {
    return (
      <main className="luxury-page admin-page">
        <section className="admin-login-panel">
          <p className="section-eyebrow">Private Dashboard</p>
          <h1>{config.label} Admin</h1>
          <p>Enter the private password to manage this advisor's listings.</p>
          {message ? <div className="admin-message">{message}</div> : null}
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              required
            />
            <button className="button primary-button" type="submit">
              Log In
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="luxury-page admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="section-eyebrow">{config.label} Control Panel</p>
            <h1>{pageTitle}</h1>
            <p>{pageDescription}</p>
          </div>
          <div className="admin-actions">
            <a className="button secondary-button" href={`${basePath}/leads`}>
              Leads
            </a>
            <a className="button secondary-button" href={`${basePath}/projects`}>
              Projects
            </a>
            <a className="button secondary-button" href={`${basePath}/resale-off-plan`}>
              Resale Off-Plan
            </a>
              <a className="button secondary-button" href={`${basePath}/areas`}>
                Prime Areas
              </a>
              <a className="button secondary-button" href="/admin/blog">
                Blog
              </a>
              <a className="button secondary-button" href="/admin/building-intelligence">
                Building Lab
              </a>
              <a className="button secondary-button" href={`${basePath}/import-properties`}>
                Bulk Import
              </a>
            <a className="button secondary-button" href={config.siteUrl}>
              View Site
            </a>
            <button className="button primary-button" type="button" onClick={() => startCreate()}>
              {isResaleScope ? "Add Resale Listing" : "Add Property"}
            </button>
            <button className="button secondary-button" type="button" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        </header>

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Total Listings</span>
            <strong>{scopedProperties.length}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Featured</span>
            <strong>{featuredCount}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Buildings</span>
            <strong>{new Set(scopedProperties.map((property) => property.building)).size}</strong>
          </article>
        </section>

        {message ? <div className="admin-message">{message}</div> : null}

        {editing === "new" ? renderPropertyForm() : null}

        <section className="admin-list-panel">
          <div className="admin-list-header">
            <div>
              <h2>{isResaleScope ? `${config.label} Resale Off-Plan` : `${config.label} Properties`}</h2>
              <span className="admin-muted-label">
                {filteredProperties.length} shown across {groupedProperties.length} areas
              </span>
            </div>
            <div className="admin-actions">
              <button className="button secondary-button" type="button" onClick={resetAdminFilters}>
                Clear Filters
              </button>
              <button className="button secondary-button" type="button" onClick={() => loadProperties()}>
                Refresh
              </button>
            </div>
          </div>

          <div className="admin-filter-bar">
            <label>
              <span>Search listings</span>
              <input
                type="search"
                value={adminSearch}
                onChange={(event) => setAdminSearch(event.target.value)}
                placeholder="Search title, area, building, price..."
              />
            </label>
            <label>
              <span>Area</span>
              <select
                value={areaFilter}
                onChange={(event) => {
                  setAreaFilter(event.target.value);
                  setBuildingFilter("all");
                }}
              >
                <option value="all">All areas</option>
                {areaOptions.map((area) => (
                  <option value={area} key={area}>
                    {area}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Building</span>
              <select value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)}>
                <option value="all">All buildings</option>
                {buildingOptions.map((building) => (
                  <option value={building} key={building}>
                    {building}
                  </option>
                ))}
              </select>
            </label>
            {!isResaleScope ? (
              <label>
                <span>Inventory Type</span>
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  <option value="all">All categories</option>
                  {categoryOptions.map((category) => (
                    <option value={category} key={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>

          <div className="admin-grouped-table">
            {groupedProperties.length ? (
              groupedProperties.map((areaGroup) => {
                const areaOpen = expandedAreas[areaGroup.name] ?? true;

                return (
                  <section className="admin-area-group" key={areaGroup.name}>
                    <button className="admin-group-header admin-area-header" type="button" onClick={() => toggleArea(areaGroup.name)}>
                      <span>{areaOpen ? "−" : "+"}</span>
                      <strong>{areaGroup.name}</strong>
                      <em>{areaGroup.total} units</em>
                    </button>

                    {areaOpen ? (
                      <div className="admin-building-groups">
                        {areaGroup.buildings.map((buildingGroup) => {
                          const buildingKey = `${areaGroup.name}::${buildingGroup.name}`;
                          const buildingOpen = expandedBuildings[buildingKey] ?? true;

                          return (
                            <section className="admin-building-group" key={buildingKey}>
                              <div className="admin-group-header admin-building-header">
                                <button type="button" onClick={() => toggleBuilding(areaGroup.name, buildingGroup.name)}>
                                  <span>{buildingOpen ? "−" : "+"}</span>
                                  <strong>{buildingGroup.name}</strong>
                                  <em>{buildingGroup.units.length} units</em>
                                </button>
                                <button
                                  className="button secondary-button admin-context-add"
                                  type="button"
                                  onClick={() => startCreate({ area: areaGroup.name, building: buildingGroup.name })}
                                >
                                  Add Unit Here
                                </button>
                              </div>

                              {buildingOpen ? (
                                <div className="admin-table">
                                  {buildingGroup.units.map((property) => (
                                    <div className="admin-property-item" key={property.id}>
                                      <article className="admin-table-row">
                                        <div>
                                          <strong>{property.title}</strong>
                                          <span>{property.building} | {property.area}</span>
                                        </div>
                                        <div>
                                          <strong>{formatPriceDisplay(property.price)}</strong>
                                          <span>{property.view}</span>
                                        </div>
                                        <div>
                                          <strong>{property.category}</strong>
                                          <span>{property.property_type}{property.bedrooms ? ` | ${property.bedrooms} BR` : ""}</span>
                                        </div>
                                        <div>
                                          <strong>{property.featured ? "Featured" : "Standard"}</strong>
                                          <span>{property.status}</span>
                                        </div>
                                        <div className="admin-row-actions">
                                          <button className="button secondary-button" type="button" onClick={() => startEdit(property)}>
                                            {editing === property.id ? "Editing" : "Edit"}
                                          </button>
                                          <button className="button admin-danger-button" type="button" onClick={() => deleteProperty(property)}>
                                            Delete
                                          </button>
                                        </div>
                                      </article>
                                      {editing === property.id ? renderPropertyForm({ inline: true }) : null}
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </section>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                );
              })
            ) : (
              <article className="contact-card empty-listings-card">
                <h3>No listings match these filters</h3>
                <p>Try clearing the search, area, or building filter to see more properties.</p>
              </article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
