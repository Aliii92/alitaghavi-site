"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { formatPriceDisplay } from "../../../../lib/price";

const advisorConfig = {
  ali: { label: "Ali Taghavi", publicUrl: "/off-plan-projects", storageKey: "ali_admin_password" },
  negin: { label: "Negin Mohamadi", publicUrl: "/off-plan-projects", storageKey: "negin_admin_password" }
};

const emptyProject = {
  id: "",
  title: "",
  developer: "",
  area: "",
  subArea: "",
  startingPrice: "",
  paymentPlan: "",
  handoverDate: "",
  bedrooms: "",
  description: "",
  features: [],
  image: "",
  whatsappLink: "",
  featured: false
};

function slugify(value) {
  return String(value || "project")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function featuresToText(features) {
  return Array.isArray(features) ? features.join("\n") : String(features || "");
}

function textToFeatures(value) {
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

export default function ScopedProjectsPage() {
  const { owner } = useParams();
  const config = advisorConfig[owner] || advisorConfig.ali;
  const basePath = `/admin/${owner}`;
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProject);
  const [featuresText, setFeaturesText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const featuredCount = useMemo(() => projects.filter((project) => project.featured).length, [projects]);

  useEffect(() => {
    const saved = window.localStorage.getItem(config.storageKey) || "";
    if (saved) {
      setStoredPassword(saved);
      loadProjects(saved);
    }
  }, [config.storageKey]);

  async function loadProjects(authPassword = storedPassword) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/projects?admin=true", {
        headers: authPassword ? { "x-admin-password": authPassword } : {}
      });
      const data = await parseApiResponse(response);

      setProjects(extractItems(data));
      return true;
    } catch (error) {
      console.error("[admin-projects:loadProjects]", error);
      setMessage(error.message || "Could not load projects.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const ok = await loadProjects(password);

    if (ok) {
      window.localStorage.setItem(config.storageKey, password);
      setStoredPassword(password);
    }
  }

  function startCreate() {
    setEditing("new");
    setForm({ ...emptyProject, id: `project-${Date.now()}` });
    setFeaturesText("");
    setImageFile(null);
    setImagePreview("");
    setMessage("");
  }

  function startEdit(project) {
    setEditing(project.id);
    setForm(project);
    setFeaturesText(featuresToText(project.features));
    setImageFile(null);
    setImagePreview(project.image || "");
    setMessage("");
  }

  function handleChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    if (name === "image" && !imageFile) setImagePreview(value);
  }

  function autoId() {
    setForm((current) => ({ ...current, id: `${slugify(current.title || current.developer || current.area)}-${Date.now()}` }));
  }

  function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  }

  async function uploadImageIfNeeded(projectId) {
    if (!imageFile) return form.image;
    const uploadData = new FormData();
    uploadData.append("image", imageFile);
    uploadData.append("propertyId", projectId || form.id);
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "x-admin-password": storedPassword },
      body: uploadData
    });
    const data = await parseApiResponse(response);
    return extractImageUrl(data);
  }

  async function saveProject(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const imageUrl = await uploadImageIfNeeded(form.id);
      const isNew = editing === "new";
      const response = await fetch(isNew ? "/api/projects" : `/api/projects/${encodeURIComponent(form.id)}`, {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword
        },
        body: JSON.stringify({ ...form, image: imageUrl, features: textToFeatures(featuresText) })
      });
      await parseApiResponse(response);

      await loadProjects();
      setEditing(null);
      setForm(emptyProject);
      setFeaturesText("");
      setImageFile(null);
      setImagePreview("");
      setMessage("Project saved successfully.");
    } catch (error) {
      setMessage(error.message || "Could not save project.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteProject(project) {
    if (!window.confirm(`Delete "${project.title}"?`)) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}`, {
        method: "DELETE",
        headers: { "x-admin-password": storedPassword }
      });
      await parseApiResponse(response);

      await loadProjects();
      setMessage("Project deleted.");
    } catch (error) {
      setMessage(error.message || "Could not delete project.");
    } finally {
      setLoading(false);
    }
  }

  if (!storedPassword) {
    return (
      <main className="luxury-page admin-page">
        <section className="admin-login-panel">
          <p className="section-eyebrow">Private Dashboard</p>
          <h1>{config.label} Projects</h1>
          <p>Enter the private password to manage this advisor's off-plan projects.</p>
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
            <h1>Off-Plan Projects</h1>
            <p>Manage only {config.label} developments and featured project cards.</p>
          </div>
          <div className="admin-actions">
            <a className="button secondary-button" href={basePath}>
              Properties
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
              <a className="button secondary-button" href={`${basePath}/leads`}>
                Leads
              </a>
            <a className="button secondary-button" href={config.publicUrl}>
              View Projects
            </a>
            <button className="button primary-button" type="button" onClick={startCreate}>
              Add Project
            </button>
          </div>
        </header>

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Total Projects</span>
            <strong>{projects.length}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Featured</span>
            <strong>{featuredCount}</strong>
          </article>
        </section>

        {message ? <div className="admin-message">{message}</div> : null}

        {editing ? (
          <section className="admin-form-panel">
            <div className="admin-form-header">
              <h2>{editing === "new" ? "Add Project" : "Edit Project"}</h2>
              <button className="button secondary-button" type="button" onClick={() => setEditing(null)}>
                Close
              </button>
            </div>
            <form onSubmit={saveProject} className="admin-property-form">
              <label>
                <span>ID</span>
                <div className="admin-inline-field">
                  <input name="id" value={form.id} onChange={handleChange} required disabled={editing !== "new"} />
                  <button className="button secondary-button" type="button" onClick={autoId} disabled={editing !== "new"}>
                    Auto
                  </button>
                </div>
              </label>
              {["title", "developer", "area", "subArea", "startingPrice", "paymentPlan", "handoverDate", "bedrooms", "image", "whatsappLink"].map((field) => (
                <label key={field}>
                  <span>{field}</span>
                  <input name={field} value={form[field] || ""} onChange={handleChange} required={["title", "developer", "area"].includes(field)} />
                </label>
              ))}
              <div className="admin-image-uploader">
                <div>
                  <span>Project Image Upload</span>
                  <p>Upload JPG, PNG, or WEBP directly from your computer.</p>
                </div>
                {imagePreview ? <img className="admin-image-preview" src={imagePreview} alt="Project preview" /> : <div className="admin-image-placeholder">No image selected</div>}
                <div className="admin-upload-actions">
                  <label className="button primary-button admin-upload-button">
                    {form.image || imageFile ? "Replace Image" : "Upload Image"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} />
                  </label>
                  <button className="button secondary-button" type="button" onClick={() => { setImageFile(null); setImagePreview(""); setForm((current) => ({ ...current, image: "" })); }}>
                    Remove Image
                  </button>
                </div>
              </div>
              <label className="admin-wide-field">
                <span>Description</span>
                <textarea name="description" value={form.description || ""} onChange={handleChange} rows={4} />
              </label>
              <label className="admin-wide-field">
                <span>Features</span>
                <textarea value={featuresText} onChange={(event) => setFeaturesText(event.target.value)} rows={4} placeholder="One feature per line" />
              </label>
              <label className="admin-checkbox-field">
                <input type="checkbox" name="featured" checked={Boolean(form.featured)} onChange={handleChange} />
                <span>Show on {config.label} homepage</span>
              </label>
              <button className="button primary-button admin-save-button" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Project"}
              </button>
            </form>
          </section>
        ) : null}

        <section className="admin-list-panel">
          <div className="admin-list-header">
            <h2>{config.label} Projects</h2>
            <button className="button secondary-button" type="button" onClick={() => loadProjects()}>
              Refresh
            </button>
          </div>
          <div className="admin-table">
            {projects.map((project) => (
              <article className="admin-table-row" key={project.id}>
                <div>
                  <strong>{project.title}</strong>
                  <span>{project.developer}</span>
                </div>
                <div>
                  <strong>{project.area}</strong>
                  <span>{project.subArea || "No sub-area"}</span>
                </div>
                <div>
                  <strong>{formatPriceDisplay(project.startingPrice)}</strong>
                  <span>{project.handoverDate || "Handover TBA"}</span>
                </div>
                <div>
                  <strong>{project.featured ? "Featured" : "Standard"}</strong>
                  <span>{project.paymentPlan || "Payment plan TBA"}</span>
                </div>
                <div className="admin-row-actions">
                  <button className="button secondary-button" type="button" onClick={() => startEdit(project)}>
                    Edit
                  </button>
                  <button className="button admin-danger-button" type="button" onClick={() => deleteProject(project)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
