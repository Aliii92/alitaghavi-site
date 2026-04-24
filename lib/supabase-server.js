function getRequiredEnv(name) {
  return process.env[name] || "";
}

export function getSupabaseServerConfig() {
  return {
    url: getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRoleKey: getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY")
  };
}

export function hasSupabaseServerConfig() {
  const { url, anonKey, serviceRoleKey } = getSupabaseServerConfig();
  return Boolean(url && anonKey && serviceRoleKey);
}

function buildHeaders({ method = "GET", prefer = "" } = {}) {
  const { serviceRoleKey } = getSupabaseServerConfig();
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`
  };

  if (method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

function normalizeBaseUrl(url = "") {
  return String(url || "").replace(/\/+$/, "");
}

async function buildSupabaseError(response, table, action) {
  const rawText = await response.text();
  let parsed = null;

  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsed = null;
  }

  const code = parsed?.code || "";
  const details = parsed?.details || parsed?.hint || parsed?.message || rawText || "Unknown Supabase error";

  if (code === "42P01" || /relation .* does not exist/i.test(details)) {
    return `Supabase table "${table}" is missing. Run the SQL in supabase/schema.sql first. URL=${response.url} status=${response.status} response=${details}`;
  }

  return `Supabase ${action} failed for ${table}. URL=${response.url} status=${response.status} response=${details}`;
}

export function buildUrl(table, params = {}) {
  const { url } = getSupabaseServerConfig();
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return `${normalizeBaseUrl(url)}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

function buildNetworkError(error, table, action, url) {
  const cause = error?.cause;
  const causeMessage = cause?.message || "";
  const code = cause?.code ? ` code=${cause.code}` : "";
  return `Supabase ${action} failed for ${table}. URL=${url} status=NETWORK_ERROR response=${error.message || "fetch failed"}${causeMessage ? ` cause=${causeMessage}` : ""}${code}`;
}

export async function supabaseSelect(table, params = {}) {
  const url = buildUrl(table, { select: "*", ...params });
  let response;
  try {
    response = await fetch(url, {
      headers: buildHeaders(),
      cache: "no-store"
    });
  } catch (error) {
    throw new Error(buildNetworkError(error, table, "select", url));
  }

  if (!response.ok) {
    throw new Error(await buildSupabaseError(response, table, "select"));
  }

  return response.json();
}

export async function supabaseUpsert(table, rows, onConflict = "id") {
  if (!Array.isArray(rows) || !rows.length) return [];

  const url = buildUrl(table, { on_conflict: onConflict });
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: buildHeaders({ method: "POST", prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify(rows),
      cache: "no-store"
    });
  } catch (error) {
    throw new Error(buildNetworkError(error, table, "upsert", url));
  }

  if (!response.ok) {
    throw new Error(await buildSupabaseError(response, table, "upsert"));
  }

  return response.json();
}

export async function supabaseDelete(table, filters = {}) {
  const url = buildUrl(table, filters);
  let response;
  try {
    response = await fetch(url, {
      method: "DELETE",
      headers: buildHeaders({ method: "DELETE", prefer: "return=minimal" }),
      cache: "no-store"
    });
  } catch (error) {
    throw new Error(buildNetworkError(error, table, "delete", url));
  }

  if (!response.ok) {
    throw new Error(await buildSupabaseError(response, table, "delete"));
  }
}

export async function syncSupabaseTable(table, rows, { idColumn = "id" } = {}) {
  const existingRows = await supabaseSelect(table, { select: idColumn });
  const nextIds = new Set(rows.map((row) => String(row[idColumn])));
  const existingIds = (Array.isArray(existingRows) ? existingRows : []).map((row) => String(row[idColumn]));

  if (rows.length) {
    await supabaseUpsert(table, rows, idColumn);
  }

  const idsToDelete = existingIds.filter((id) => !nextIds.has(id));
  if (idsToDelete.length) {
    await supabaseDelete(table, {
      [idColumn]: `in.(${idsToDelete.map((id) => `"${id}"`).join(",")})`
    });
  }
}
