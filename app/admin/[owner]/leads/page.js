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

        <section className="admin-list-panel">
          <div className="admin-list-header">
            <h2>Tracked Leads</h2>
            <span className="admin-muted-label">{leads.length} records</span>
          </div>
          <div className="admin-leads-table">
            {leads.map((lead) => (
              <article className="admin-lead-row" key={lead.id}>
                <div>
                  <strong>{new Date(lead.created_at).toLocaleString()}</strong>
                  <span>{lead.language_mode}</span>
                </div>
                <div>
                  <strong>{lead.advisor_name}</strong>
                  <span>{lead.source_page}</span>
                </div>
                <div>
                  <strong>{lead.property_title}</strong>
                  <span>{lead.building || lead.area}</span>
                </div>
                <div>
                  <strong>{lead.price}</strong>
                  <span>{lead.property_type}{lead.bedrooms ? ` | ${lead.bedrooms} BR` : ""}</span>
                </div>
                <div>
                  <strong>{lead.utm_source || "direct"}</strong>
                  <span>{[lead.utm_medium, lead.utm_campaign, lead.utm_content, lead.utm_term].filter(Boolean).join(" | ") || "No campaign details"}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
