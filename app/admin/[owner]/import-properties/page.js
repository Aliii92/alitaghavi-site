"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const advisorConfig = {
  ali: { label: "Ali Taghavi", storageKey: "ali_admin_password" },
  negin: { label: "Negin Mohamadi", storageKey: "negin_admin_password" }
};

const previewColumns = ["id", "title", "area", "building", "inventory_type", "property_type", "bedrooms", "size", "price", "status"];

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

  return data || {};
}

export default function BulkImportPropertiesPage() {
  const { owner } = useParams();
  const router = useRouter();
  const config = advisorConfig[owner] || advisorConfig.ali;
  const basePath = `/admin/${owner}`;
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState("");
  const [file, setFile] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validRows = useMemo(() => preview?.validRows || [], [preview]);
  const errorRows = useMemo(() => preview?.rows?.filter((row) => row.errors.length) || [], [preview]);

  useEffect(() => {
    const saved = window.localStorage.getItem(config.storageKey) || "";
    if (saved) setStoredPassword(saved);
  }, [config.storageKey]);

  function handleLogin(event) {
    event.preventDefault();
    window.localStorage.setItem(config.storageKey, password);
    setStoredPassword(password);
    setPassword("");
  }

  function downloadTemplate(format = "csv") {
    window.open(`/api/properties/import${format === "xlsx" ? "?format=xlsx" : ""}`, "_blank", "noopener,noreferrer");
  }

  async function previewImport(event) {
    event.preventDefault();
    if (!file) {
      setMessage("Please choose a CSV or XLSX file first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/properties/import?mode=preview&updateExisting=${updateExisting}`, {
        method: "POST",
        headers: {
          "x-admin-password": storedPassword
        },
        body: formData
      });
      const data = await parseApiResponse(response);

      setPreview(data);
      setMessage(`Preview ready: ${data.valid} valid rows, ${data.failed} rows with issues.`);
    } catch (error) {
      console.error("[admin-import-properties:previewImport]", error);
      setMessage(error.message || "Could not preview import.");
    } finally {
      setLoading(false);
    }
  }

  async function commitImport() {
    if (!validRows.length) {
      setMessage("There are no valid rows to import.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/properties/import?mode=commit&updateExisting=${updateExisting}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": storedPassword
        },
        body: JSON.stringify({ rows: validRows })
      });
      const data = await parseApiResponse(response);

      setMessage(`${data.imported || 0} properties imported successfully${data.updated ? `, ${data.updated} updated` : ""}.`);
      setPreview(null);
      setFile(null);
      router.refresh();
      window.setTimeout(() => {
        router.push(basePath);
        router.refresh();
      }, 900);
    } catch (error) {
      console.error("[admin-import-properties:commit]", error);
      setMessage(error.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!storedPassword) {
    return (
      <main className="luxury-page admin-page">
        <section className="admin-login-panel">
          <p className="section-eyebrow">Private Dashboard</p>
          <h1>{config.label} Bulk Import</h1>
          <p>Enter the private password before importing property records.</p>
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
              Continue
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
            <h1>Bulk Import Properties</h1>
            <p>Upload CSV or XLSX files using the same schema as the single-property form.</p>
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
            <button className="button secondary-button" type="button" onClick={() => downloadTemplate("csv")}>
              Download CSV Template
            </button>
            <button className="button secondary-button" type="button" onClick={() => downloadTemplate("xlsx")}>
              Download XLSX Template
            </button>
          </div>
        </header>

        {message ? <div className="admin-message">{message}</div> : null}

        <section className="admin-form-panel">
          <div className="admin-form-header">
            <h2>Upload File</h2>
          </div>
          <form className="admin-import-form" onSubmit={previewImport}>
            <div className="admin-import-dropzone">
              <strong>Supported formats: CSV and XLSX</strong>
              <span>Columns must match the property model: id, title, area, building, inventory_type, property_type, bedrooms, size, price, view, furnishing, status, short_description, notes, image_url, featured, whatsapp_link, owner. Inventory type must be exactly Ready, Off-plan, or Resale Off-Plan.</span>
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  setFile(event.target.files?.[0] || null);
                  setPreview(null);
                  setMessage("");
                }}
              />
              {file ? <em>{file.name}</em> : null}
            </div>

            <label className="admin-checkbox-field">
              <input type="checkbox" checked={updateExisting} onChange={(event) => setUpdateExisting(event.target.checked)} />
              <span>Update existing records when ID already exists</span>
            </label>

            <button className="button primary-button admin-save-button" type="submit" disabled={loading}>
              {loading ? "Reading..." : "Preview Import"}
            </button>
          </form>
        </section>

        {preview ? (
          <section className="admin-list-panel">
            <div className="admin-list-header">
              <h2>Preview</h2>
              <span className="admin-muted-label">
                {preview.valid} valid / {preview.failed} failed / {preview.total} total
              </span>
            </div>

            {errorRows.length ? (
              <div className="admin-import-errors">
                <strong>Rows needing attention</strong>
                {errorRows.map((row) => (
                  <p key={row.rowNumber}>
                    Row {row.rowNumber}: {row.errors.join(", ")}
                  </p>
                ))}
              </div>
            ) : null}

            <div className="admin-import-table">
              <div className="admin-import-row admin-import-heading">
                {previewColumns.map((column) => (
                  <strong key={column}>{column}</strong>
                ))}
              </div>
              {validRows.slice(0, 12).map((property) => (
                <div className="admin-import-row" key={property.id}>
                  {previewColumns.map((column) => (
                    <span key={column}>{String(property[column] || "")}</span>
                  ))}
                </div>
              ))}
            </div>

            {validRows.length > 12 ? <p className="admin-muted-label">Showing first 12 valid rows only. All valid rows will import.</p> : null}

            <div className="admin-actions admin-import-confirm">
              <button className="button primary-button" type="button" onClick={commitImport} disabled={loading || !validRows.length}>
                {loading ? "Importing..." : `Import ${validRows.length} Valid Rows`}
              </button>
              <button className="button secondary-button" type="button" onClick={() => setPreview(null)}>
                Clear Preview
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
