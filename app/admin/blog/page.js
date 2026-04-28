"use client";

import { useEffect, useMemo, useState } from "react";

const storageKeys = ["ali_admin_password", "negin_admin_password", "blog_admin_password"];

const emptyPost = {
  id: "",
  title_en: "",
  title_fa: "",
  slug: "",
  excerpt_en: "",
  excerpt_fa: "",
  content_en: "",
  content_fa: "",
  cover_image_url: "",
  category: "",
  author: "Ali Taghavi",
  status: "draft",
  published_at: ""
};

function slugify(value) {
  return String(value || "blog-post")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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
    throw new Error(data?.error || raw || `Request failed with status ${response.status}.`);
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

export default function AdminBlogPage() {
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPost);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const publishedCount = useMemo(() => posts.filter((post) => post.status === "published").length, [posts]);

  useEffect(() => {
    const saved = storageKeys.map((key) => window.localStorage.getItem(key) || "").find(Boolean) || "";
    if (saved) {
      setStoredPassword(saved);
      window.localStorage.setItem("blog_admin_password", saved);
      loadPosts(saved);
    }
  }, []);

  async function loadPosts(authPassword = storedPassword) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/blog?admin=true", {
        headers: authPassword ? { "x-admin-password": authPassword } : {}
      });
      const data = await parseApiResponse(response);
      setPosts(extractItems(data));
      return true;
    } catch (error) {
      console.error("[admin-blog:loadPosts]", error);
      setMessage(error.message || "Could not load blog posts.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const ok = await loadPosts(password);
    if (ok) {
      setStoredPassword(password);
      window.localStorage.setItem("blog_admin_password", password);
      setPassword("");
    }
  }

  function startCreate() {
    setEditing("new");
    setForm({ ...emptyPost, id: `blog-${Date.now()}`, author: "Ali Taghavi" });
    setImageFile(null);
    setImagePreview("");
    setMessage("");
  }

  function startEdit(post) {
    setEditing(post.id);
    setForm({
      ...emptyPost,
      ...post,
      published_at: post.published_at ? String(post.published_at).slice(0, 10) : ""
    });
    setImageFile(null);
    setImagePreview(post.cover_image_url || "");
    setMessage("");
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyPost);
    setImageFile(null);
    setImagePreview("");
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name === "cover_image_url" && !imageFile) setImagePreview(value);
  }

  function autoSlug() {
    setForm((current) => ({
      ...current,
      slug: slugify(current.title_en || current.title_fa || current.id),
      id: current.id || `blog-${Date.now()}`
    }));
  }

  function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  }

  async function uploadImageIfNeeded(postId) {
    if (!imageFile) return form.cover_image_url;
    const uploadData = new FormData();
    uploadData.append("image", imageFile);
    uploadData.append("propertyId", postId || form.id);
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { "x-admin-password": storedPassword },
      body: uploadData
    });
    const data = await parseApiResponse(response);
    return extractImageUrl(data);
  }

  async function savePost(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const coverImageUrl = await uploadImageIfNeeded(form.id);
      const payload = {
        ...form,
        id: form.id || `blog-${Date.now()}`,
        slug: form.slug || slugify(form.title_en || form.title_fa || form.id),
        cover_image_url: coverImageUrl,
        published_at: form.status === "published" ? (form.published_at || new Date().toISOString().slice(0, 10)) : null
      };
      const response = await fetch("/api/blog", {
        method: editing === "new" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword
        },
        body: JSON.stringify(payload)
      });
      await parseApiResponse(response);
      await loadPosts();
      cancelEdit();
      setMessage("Blog post saved successfully.");
    } catch (error) {
      console.error("[admin-blog:savePost]", error);
      setMessage(error.message || "Could not save blog post.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(post) {
    if (!window.confirm(`Delete "${post.title_en || post.title_fa || post.slug}"?`)) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/blog?id=${encodeURIComponent(post.id)}&slug=${encodeURIComponent(post.slug || "")}`, {
        method: "DELETE",
        headers: { "x-admin-password": storedPassword }
      });
      await parseApiResponse(response);
      await loadPosts();
      setMessage("Blog post deleted.");
    } catch (error) {
      console.error("[admin-blog:deletePost]", error);
      setMessage(error.message || "Could not delete blog post.");
    } finally {
      setLoading(false);
    }
  }

  if (!storedPassword) {
    return (
      <main className="luxury-page admin-page">
        <section className="admin-login-panel">
          <p className="section-eyebrow">Private Dashboard</p>
          <h1>Blog / Market Insights</h1>
          <p>Enter an admin password to manage published and draft market insights.</p>
          {message ? <div className="admin-message">{message}</div> : null}
          <form onSubmit={handleLogin} className="admin-login-form">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Admin password" required />
            <button className="button primary-button" type="submit">Log In</button>
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
            <p className="section-eyebrow">Editorial CMS</p>
            <h1>Blog / Market Insights</h1>
            <p>Manage draft and published blog posts for the public market insights section.</p>
          </div>
          <div className="admin-actions">
            <a className="button secondary-button" href="/admin">Admin Home</a>
            <a className="button secondary-button" href="/blog" target="_blank" rel="noopener noreferrer">View Blog</a>
            <button className="button primary-button" type="button" onClick={startCreate}>Add Post</button>
          </div>
        </header>

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Total Posts</span>
            <strong>{posts.length}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </article>
          <article className="admin-stat-card">
            <span>Drafts</span>
            <strong>{posts.length - publishedCount}</strong>
          </article>
        </section>

        {message ? <div className="admin-message">{message}</div> : null}

        {editing ? (
          <section className="admin-form-panel">
            <div className="admin-form-header">
              <h2>{editing === "new" ? "Add Blog Post" : "Edit Blog Post"}</h2>
              <button className="button secondary-button" type="button" onClick={cancelEdit}>Cancel</button>
            </div>

            <form onSubmit={savePost} className="admin-property-form">
              <label>
                <span>ID</span>
                <input name="id" value={form.id} onChange={handleChange} required />
              </label>
              <label>
                <span>Slug</span>
                <div className="admin-inline-field">
                  <input name="slug" value={form.slug} onChange={handleChange} required />
                  <button className="button secondary-button" type="button" onClick={autoSlug}>Auto</button>
                </div>
              </label>
              <label>
                <span>Category</span>
                <input name="category" value={form.category} onChange={handleChange} />
              </label>
              <label>
                <span>Author</span>
                <input name="author" value={form.author} onChange={handleChange} />
              </label>
              <label>
                <span>Status</span>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label>
                <span>Published Date</span>
                <input name="published_at" type="date" value={form.published_at} onChange={handleChange} />
              </label>
              <label className="admin-wide-field">
                <span>English Title</span>
                <input name="title_en" value={form.title_en} onChange={handleChange} required />
              </label>
              <label className="admin-wide-field">
                <span>Persian Title</span>
                <input name="title_fa" value={form.title_fa} onChange={handleChange} />
              </label>
              <label className="admin-wide-field">
                <span>English Excerpt</span>
                <textarea name="excerpt_en" value={form.excerpt_en} onChange={handleChange} rows={3} />
              </label>
              <label className="admin-wide-field">
                <span>Persian Excerpt</span>
                <textarea name="excerpt_fa" value={form.excerpt_fa} onChange={handleChange} rows={3} />
              </label>
              <label className="admin-wide-field">
                <span>Cover Image URL</span>
                <input name="cover_image_url" value={form.cover_image_url} onChange={handleChange} />
              </label>

              <div className="admin-image-uploader">
                <div>
                  <span>Cover Image Upload</span>
                  <p>Upload a cover image or paste a public image URL. If empty, the blog placeholder is used.</p>
                </div>
                {imagePreview ? <img className="admin-image-preview" src={imagePreview} alt="Blog preview" /> : <div className="admin-image-placeholder">No image selected</div>}
                <div className="admin-upload-actions">
                  <label className="button primary-button admin-upload-button">
                    {form.cover_image_url || imageFile ? "Replace Image" : "Upload Image"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} />
                  </label>
                  <button className="button secondary-button" type="button" onClick={() => { setImageFile(null); setImagePreview(""); setForm((current) => ({ ...current, cover_image_url: "" })); }}>
                    Remove Image
                  </button>
                </div>
              </div>

              <label className="admin-wide-field">
                <span>English Content</span>
                <textarea name="content_en" value={form.content_en} onChange={handleChange} rows={12} />
              </label>
              <label className="admin-wide-field">
                <span>Persian Content</span>
                <textarea name="content_fa" value={form.content_fa} onChange={handleChange} rows={12} dir="rtl" />
              </label>

              <button className="button primary-button" type="submit" disabled={loading}>
                {loading ? "Saving..." : editing === "new" ? "Create Post" : "Save Changes"}
              </button>
            </form>
          </section>
        ) : null}

        <section className="admin-list-panel">
          <div className="admin-list-header">
            <h2>All Blog Posts</h2>
            <button className="button secondary-button" type="button" onClick={() => loadPosts()}>Refresh</button>
          </div>

          <div className="admin-table">
            {posts.map((post) => (
              <article className="admin-table-row" key={post.id}>
                <div>
                  <strong>{post.title_en || post.title_fa || post.slug}</strong>
                  <p>{post.slug}</p>
                  <small>{post.category || "Uncategorized"} · {post.author || "Ali Taghavi"}</small>
                </div>
                <div>
                  <strong>{post.status === "published" ? "Published" : "Draft"}</strong>
                  <p>{post.published_at ? String(post.published_at).slice(0, 10) : "Not scheduled"}</p>
                </div>
                <div className="admin-row-actions">
                  <a className="button secondary-button" href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">View</a>
                  <button className="button secondary-button" type="button" onClick={() => startEdit(post)}>Edit</button>
                  <button className="button danger-button" type="button" onClick={() => deletePost(post)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
