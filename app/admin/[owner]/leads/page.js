"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const advisorConfig = {
  ali: { label: "Ali Taghavi", storageKey: "ali_admin_password" }
};

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

export default function ScopedLeadsPage() {
  const { owner } = useParams();
  const config = advisorConfig[owner] || advisorConfig.ali;
  const basePath = `/admin/${owner}`;
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [leads, setLeads] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState("");
  const visibleLeads = leads.filter(lead => (status === "all" || (lead.status || "new") === status) &&
    [lead.name,lead.phone,lead.email,lead.property_title,lead.source_page].join(" ").toLowerCase().includes(query.toLowerCase()));
  async function updateStatus(id,status) {
    setUpdatingId(id);
    try {
      await parseApiResponse(await fetch("/api/leads", {method:"PATCH",headers:{"Content-Type":"application/json","x-admin-password":storedPassword},body:JSON.stringify({id,status})}));
      setLeads(current=>current.map(lead=>lead.id === id ? {...lead,status} : lead));
    } catch (error) { setMessage(error.message); } finally { setUpdatingId(""); }
  }

  useEffect(() => {
    const saved = window.localStorage.getItem(config.storageKey) || "";
    if (saved) {
      setStoredPassword(saved);
      loadLeads(saved);
    }
  }, [config.storageKey]);

  async function loadLeads(authPassword = storedPassword) {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        headers: authPassword ? { "x-admin-password": authPassword } : {}
      });
      const data = await parseApiResponse(response);

      setLeads(Array.isArray(data) ? data : []);
      return true;
    } catch (error) {
      console.error("[admin-leads:loadLeads]", error);
      setMessage(error.message || "Could not load leads.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const ok = await loadLeads(password);

    if (ok) {
      window.localStorage.setItem(config.storageKey, password);
      setStoredPassword(password);
    }
  }

  if (!storedPassword) {
    return (
      <main className="luxury-page admin-page">
        <section className="admin-login-panel">
          <p className="section-eyebrow">Private Dashboard</p>
          <h1>{config.label} Leads</h1>
          <p>Enter the private password to view this advisor's WhatsApp inquiries.</p>
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
            <p className="section-eyebrow">{config.label} Lead Tracking</p>
            <h1>Leads</h1>
            <p>Only {config.label} inquiries are shown here.</p>
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
            <a className="button secondary-button" href={`${basePath}/areas`}>
              Prime Areas
            </a>
            <button className="button primary-button" type="button" onClick={() => loadLeads()}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </header>

        {message ? <div className="admin-message">{message}</div> : null}

        <section className="admin-stats-grid">
          <article className="admin-stat-card"><span>Consultation requests</span><strong>{leads.filter(l=>l.lead_type === "consultation").length}</strong></article>
          <article className="admin-stat-card"><span>WhatsApp clicks</span><strong>{leads.filter(l=>l.lead_type !== "consultation").length}</strong></article>
          <article className="admin-stat-card"><span>New consultations</span><strong>{leads.filter(l=>l.lead_type === "consultation" && (l.status || "new") === "new").length}</strong></article>
        </section>
        <section className="admin-list-panel">
          <div className="admin-filter-bar"><label><span>Search contacts or properties</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} /></label><label><span>Follow-up status</span><select value={status} onChange={e=>setStatus(e.target.value)}>{["all","new","contacted","qualified","closed"].map(s=><option key={s}>{s}</option>)}</select></label></div>
          <div className="admin-list-header">
            <h2>Tracked Leads</h2>
            <span className="admin-muted-label">{leads.length} records</span>
          </div>
          <div className="admin-leads-table">
            {visibleLeads.map((lead) => (
              <article className="admin-lead-row" key={lead.id}>
                <div>
                  <strong>{new Date(lead.created_at).toLocaleString()}</strong>
                  <span>{lead.language_mode}</span>
                </div>
                <div>
                  <strong>{lead.name || (lead.lead_type === "consultation" ? "Consultation" : "WhatsApp click")}</strong>
                  {lead.phone && <a href={`tel:${lead.phone.replace(/[^+0-9]/g, "")}`} dir="ltr">{lead.phone}</a>}
                  {lead.email && <a href={`mailto:${lead.email}`}>{lead.email}</a>}
                  <span>{lead.source_page}</span>
                </div>
                <div>
                  <strong>{lead.property_title}</strong>
                  <span>{lead.building || lead.area}</span>
                </div>
                <div>
                  <strong>{lead.budget || lead.price}</strong>
                  <span>{lead.purpose}</span>
                  <span>{lead.property_type}{lead.bedrooms ? ` | ${lead.bedrooms} BR` : ""}</span>
                </div>
                <div>
                  <strong>{lead.utm_source || "direct"}</strong>
                  <span>{[lead.utm_medium, lead.utm_campaign, lead.utm_content, lead.utm_term].filter(Boolean).join(" | ") || "No campaign details"}</span>
                </div>
                <div><label><span>Follow-up</span><select aria-label="Follow-up status" disabled={updatingId === lead.id} value={lead.status || "new"} onChange={e=>updateStatus(lead.id,e.target.value)}>{["new","contacted","qualified","closed"].map(s=><option key={s}>{s}</option>)}</select></label></div>
                {lead.message_preview && <p className="admin-lead-message">{lead.message_preview}</p>}
              </article>
            ))}
            {!visibleLeads.length && <p>No enquiries match your filters.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

