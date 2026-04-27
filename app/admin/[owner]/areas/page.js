"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const advisorConfig = {
  ali: { label: "Ali Taghavi", storageKey: "ali_admin_password" },
  negin: { label: "Negin Mohamadi", storageKey: "negin_admin_password" }
};

const emptyArea = {
  id: "",
  slug: "",
  area_name: "",
  short_title: "",
  overview_card_title: "",
  excerpt: "",
  short_description: "",
  hero_title: "",
  featured_image: "",
  content_body: "",
  seo_title: "",
  seo_description: "",
  full_description: "",
  lifestyle_text: "",
  investment_analysis: "",
  bullet_points: [],
  image_url: "",
  gallery_images: [],
  featured: true,
  active: true,
  display_order: 0
};

function slugify(value) {
  return String(value || "area")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function listToText(value) {
  return Array.isArray(value) ? value.join("\n") : String(value || "");
}

function textToList(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
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

export default function AdminAreasPage() {
  const { owner } = useParams();
  const config = advisorConfig[owner] || advisorConfig.ali;
  const basePath = `/admin/${owner}`;
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [areas, setAreas] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyArea);
  const [bulletText, setBulletText] = useState("");
  const [galleryText, setGalleryText] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const visibleCount = useMemo(() => areas.filter((area) => area.active && area.featured).length, [areas]);

  useEffect(() => {
    const saved = window.localStorage.getItem(config.storageKey) || "";
    if (saved) {
      setStoredPassword(saved);
      loadAreas(saved);
    }
  }, [config.storageKey]);

  async function loadAreas(authPassword = storedPassword) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/areas?admin=true", {
        headers: authPassword ? { "x-admin-password": authPassword } : {}
      });
      const data = await parseApiResponse(response);

      setAreas(extractItems(data));
      return true;
    } catch (error) {
      console.error("[admin-areas:loadAreas]", error);
      setMessage(error.message || "Could not load prime areas.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const ok = await loadAreas(password);

    if (ok) {
      window.localStorage.setItem(config.storageKey, password);
      setStoredPassword(password);
      setPassword("");
    }
  }

  function startCreate() {
    setEditing("new");
    setForm({ ...emptyArea, id: `area-${Date.now()}`, display_order: areas.length + 1 });
    setBulletText("");
    setGalleryText("");
    setContentBody("");
    setImageFile(null);
    setImagePreview("");
    setMessage("");
  }

  function startEdit(area) {
    if (editing === area.id) {
      cancelEdit();
      return;
    }

    setEditing(area.id);
    setForm(area);
    setBulletText(listToText(area.bullet_points || area.notes));
    setGalleryText(listToText(area.gallery_images));
    setContentBody(area.content_body || "");
    setImageFile(null);
    setImagePreview(area.featured_image || area.image_url || "");
    setMessage("");
  }

  function insertRichText(command, value = null) {
    document.execCommand(command, false, value);
    syncEditorHtml();
  }

  function insertLink() {
    const url = window.prompt("Enter URL");
    if (!url) return;
    insertRichText("createLink", url);
  }

  function syncEditorHtml() {
    const editor = document.getElementById("area-content-editor");
    if (!editor) return;
    setContentBody(editor.innerHTML);
  }

  function renderAreaForm({ inline = false } = {}) {
    return (
      <section className={inline ? "admin-form-panel admin-inline-edit-panel admin-area-inline-editor" : "admin-form-panel"}>
        <div className="admin-form-header">
          <h2>{editing === "new" ? "Add Prime Area" : "Edit Prime Area"}</h2>
          <button className="button secondary-button" type="button" onClick={cancelEdit}>
            Cancel
          </button>
        </div>

        <form onSubmit={saveArea} className="admin-property-form">
          <label>
            <span>ID / Slug</span>
            <div className="admin-inline-field">
              <input name="id" value={form.id || ""} onChange={handleChange} required />
              <button className="button secondary-button" type="button" onClick={autoSlug}>
                Auto
              </button>
            </div>
          </label>
          <label>
            <span>Slug</span>
            <input name="slug" value={form.slug || ""} onChange={handleChange} required />
          </label>
          <label>
            <span>Area Name</span>
            <input name="area_name" value={form.area_name || form.name || ""} onChange={handleChange} required />
          </label>
          <label>
            <span>Short Title</span>
            <input name="short_title" value={form.short_title || ""} onChange={handleChange} />
          </label>
          <label>
            <span>Overview Card Title</span>
            <input name="overview_card_title" value={form.overview_card_title || ""} onChange={handleChange} />
          </label>
          <label>
            <span>Excerpt / Short Intro</span>
            <textarea name="excerpt" value={form.excerpt || ""} onChange={handleChange} rows={3} />
          </label>
          <label>
            <span>Hero Title</span>
            <input name="hero_title" value={form.hero_title || ""} onChange={handleChange} />
          </label>
          <label>
            <span>SEO Title</span>
            <input name="seo_title" value={form.seo_title || ""} onChange={handleChange} />
          </label>
          <label className="admin-wide-field">
            <span>SEO Description</span>
            <textarea name="seo_description" value={form.seo_description || ""} onChange={handleChange} rows={3} />
          </label>
          <label>
            <span>Display Order</span>
            <input name="display_order" type="number" value={form.display_order || 0} onChange={handleChange} />
          </label>
          <label>
            <span>Image URL</span>
            <input name="image_url" value={form.image_url || ""} onChange={handleChange} />
          </label>
          <label>
            <span>Featured Image URL</span>
            <input name="featured_image" value={form.featured_image || ""} onChange={handleChange} />
          </label>

          <div className="admin-image-uploader">
            <div>
              <span>Area Image Upload</span>
              <p>Upload a premium area image or paste an image URL above. The uploaded image will be used as both card and featured image by default.</p>
            </div>
            {imagePreview ? <img className="admin-image-preview" src={imagePreview} alt="Area preview" /> : <div className="admin-image-placeholder">No image selected</div>}
            <div className="admin-upload-actions">
              <label className="button primary-button admin-upload-button">
                {form.image_url || imageFile ? "Replace Image" : "Upload Image"}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} />
              </label>
              <button className="button secondary-button" type="button" onClick={() => { setImageFile(null); setImagePreview(""); setForm((current) => ({ ...current, image_url: "" })); }}>
                Remove Image
              </button>
            </div>
          </div>

          <label className="admin-wide-field">
            <span>Short Description</span>
            <textarea name="short_description" value={form.short_description || form.note || ""} onChange={handleChange} rows={3} />
          </label>
          <div className="admin-wide-field admin-rich-editor-field">
            <span>Rich Content Body</span>
            <p className="admin-field-help">Use headings, paragraphs, lists, bold text, and links to publish a polished editorial-style area guide.</p>
            <div className="admin-rich-editor-toolbar">
              <button type="button" className="button secondary-button" onClick={() => insertRichText("formatBlock", "<h2>")}>H2</button>
              <button type="button" className="button secondary-button" onClick={() => insertRichText("formatBlock", "<h3>")}>H3</button>
              <button type="button" className="button secondary-button" onClick={() => insertRichText("bold")}>Bold</button>
              <button type="button" className="button secondary-button" onClick={() => insertRichText("insertUnorderedList")}>Bullets</button>
              <button type="button" className="button secondary-button" onClick={() => insertRichText("insertOrderedList")}>Numbers</button>
              <button type="button" className="button secondary-button" onClick={insertLink}>Link</button>
            </div>
            <div
              id="area-content-editor"
              className="admin-rich-editor"
              contentEditable
              suppressContentEditableWarning
              onInput={syncEditorHtml}
              dangerouslySetInnerHTML={{ __html: contentBody }}
            />
          </div>
          <label className="admin-wide-field">
            <span>Full Description</span>
            <textarea name="full_description" value={form.full_description || ""} onChange={handleChange} rows={5} />
          </label>
          <label className="admin-wide-field">
            <span>Lifestyle Text</span>
            <textarea name="lifestyle_text" value={form.lifestyle_text || ""} onChange={handleChange} rows={4} />
          </label>
          <label className="admin-wide-field">
            <span>Investment Analysis</span>
            <textarea name="investment_analysis" value={form.investment_analysis || ""} onChange={handleChange} rows={4} />
          </label>
          <label className="admin-wide-field">
            <span>Bullet Points / Highlights</span>
            <textarea value={bulletText} onChange={(event) => setBulletText(event.target.value)} rows={4} placeholder="One highlight per line" />
          </label>
          <label className="admin-wide-field">
            <span>Gallery Images</span>
            <textarea value={galleryText} onChange={(event) => setGalleryText(event.target.value)} rows={3} placeholder="Optional: one image URL per line" />
          </label>

          <label className="admin-checkbox-field">
            <input type="checkbox" name="featured" checked={Boolean(form.featured)} onChange={handleChange} />
            <span>Show in Prime Areas section</span>
          </label>
          <label className="admin-checkbox-field">
            <input type="checkbox" name="active" checked={Boolean(form.active)} onChange={handleChange} />
            <span>Active / visible publicly</span>
          </label>

          <button className="button primary-button admin-save-button" type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Area"}
          </button>
        </form>
      </section>
    );
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyArea);
    setBulletText("");
    setGalleryText("");
    setContentBody("");
    setImageFile(null);
    setImagePreview("");
  }

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    if ((name === "image_url" || name === "featured_image") && !imageFile) setImagePreview(value);
  }

  function autoSlug() {
    setForm((current) => {
      const slug = slugify(current.area_name || current.overview_card_title || current.short_title);
      return { ...current, id: slug, slug };
    });
  }

  function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  }

  async function uploadImageIfNeeded(areaId) {
    if (!imageFile) return form.featured_image || form.image_url;
    const uploadData = new FormData();
    uploadData.append("image", imageFile);
    uploadData.append("propertyId", `area-${areaId || form.id}`);
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "x-admin-password": storedPassword },
      body: uploadData
    });
    const data = await parseApiResponse(response);
    return extractImageUrl(data);
  }

  async function saveArea(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const imageUrl = await uploadImageIfNeeded(form.id);
      const payload = {
        ...form,
        image_url: imageUrl,
        featured_image: form.featured_image || imageUrl,
        slug: form.slug || slugify(form.area_name),
        id: form.id || `${owner}-${form.slug || slugify(form.area_name)}`,
        owner,
        content_body: contentBody,
        bullet_points: textToList(bulletText),
        gallery_images: textToList(galleryText),
        display_order: Number(form.display_order || 0)
      };
      const response = await fetch("/api/areas", {
        method: editing === "new" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword
        },
        body: JSON.stringify(payload)
      });
      await parseApiResponse(response);

      await loadAreas();
      cancelEdit();
      setMessage("Prime area saved successfully.");
    } catch (error) {
      setMessage(error.message || "Could not save area.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteArea(area) {
    if (!window.confirm(`Delete "${area.area_name || area.name}"?`)) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/areas?id=${encodeURIComponent(area.id || area.slug)}`, {
        method: "DELETE",
        headers: { "x-admin-password": storedPassword }
      });
      await parseApiResponse(response);

      await loadAreas();
      setMessage("Prime area deleted.");
    } catch (error) {
      setMessage(error.message || "Could not delete area.");
    } finally {
      setLoading(false);
    }
  }

  if (!storedPassword) {
    return (
      <main className="luxury-page admin-page">
        <section className="admin-login-panel">
          <p className="section-eyebrow">Private Dashboard</p>
          <h1>{config.label} Prime Areas</h1>
          <p>Enter the private password to manage area insights and market analysis.</p>
          {message ? <div className="admin-message">{message}</div> : null}
          <form onSubmit={handleLogin} className="admin-login-form">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" required />
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
            <h1>Prime Areas</h1>
            <p>Manage public area cards, editorial guides, SEO, rich content, and market analysis.</p>
          </div>
          <div className="admin-actions">
            <a className="button secondary-button" href={basePath}>
              Properties
            </a>
            <a className="button secondary-button" href={`${basePath}/resale-off-plan`}>
              Resale Off-Plan
            </a>
            <a className="button secondary-button" href={`${basePath}/projects`}>
              Projects
            </a>
            <a className="button secondary-button" href={`${basePath}/leads`}>
              Leads
            </a>
            <a className="button secondary-button" href="/">
              View Site
            </a>
            <button className="button primary-button" type="button" onClick={startCreate}>
              Add Area
            </button>
          </div>
        </header>

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Total Areas</span>
            <strong>{areas.length}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Visible</span>
            <strong>{visibleCount}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Next Order</span>
            <strong>{areas.length + 1}</strong>
          </article>
        </section>

        {message ? <div className="admin-message">{message}</div> : null}

        {editing === "new" ? renderAreaForm() : null}

        <section className="admin-list-panel">
          <div className="admin-list-header">
            <h2>Managed Prime Areas</h2>
            <button className="button secondary-button" type="button" onClick={() => loadAreas()}>
              Refresh
            </button>
          </div>
          <div className="admin-table">
            {areas
              .slice()
              .sort((left, right) => (left.display_order || 0) - (right.display_order || 0) || left.area_name.localeCompare(right.area_name))
              .map((area) => (
                <div className={`admin-property-item ${editing === area.id ? "admin-area-editing" : ""}`} key={area.id}>
                  <article className="admin-table-row">
                  <div>
                    <strong>{area.overview_card_title || area.area_name}</strong>
                    <span>{area.slug} | owner: {area.owner}</span>
                  </div>
                    <div>
                      <strong>{area.active ? "Active" : "Hidden"}</strong>
                      <span>{area.featured ? "Featured" : "Not featured"}</span>
                    </div>
                    <div>
                      <strong>Order {area.display_order || 0}</strong>
                      <span>{area.short_title || "No short title"}</span>
                    </div>
                    <div>
                      <strong>{(area.bullet_points || []).length} highlights</strong>
                      <span>{area.short_description || area.note || "No short description"}</span>
                    </div>
                    <div>
                      <strong>{area.content_body ? "Editorial body ready" : "No article body"}</strong>
                      <span>{area.seo_title || "No SEO title"}</span>
                    </div>
                    <div className="admin-row-actions">
                      <a
                        className="button secondary-button"
                        href={`/prime-areas/${area.owner === "negin" ? `negin-${area.slug}` : area.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                      <button className="button secondary-button" type="button" onClick={() => startEdit(area)}>
                        {editing === area.id ? "Close Edit" : "Edit"}
                      </button>
                      <button className="button admin-danger-button" type="button" onClick={() => deleteArea(area)}>
                        Delete
                      </button>
                    </div>
                  </article>
                  {editing === area.id ? renderAreaForm({ inline: true }) : null}
                </div>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
