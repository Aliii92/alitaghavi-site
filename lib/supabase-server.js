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
  const { anonKey, serviceRoleKey } = getSupabaseServerConfig();
  const headers = {
    apikey: anonKey,
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

function buildUrl(table, params = {}) {
  const { url } = getSupabaseServerConfig();
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return `${url}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

export async function supabaseSelect(table, params = {}) {
  const response = await fetch(buildUrl(table, { select: "*", ...params }), {
    headers: buildHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase select failed for ${table}: ${errorText}`);
  }

  return response.json();
}

export async function supabaseUpsert(table, rows, onConflict = "id") {
  if (!Array.isArray(rows) || !rows.length) return [];

  const response = await fetch(buildUrl(table, { on_conflict: onConflict }), {
    method: "POST",
    headers: buildHeaders({ method: "POST", prefer: "resolution=merge-duplicates,return=representation" }),
    body: JSON.stringify(rows),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase upsert failed for ${table}: ${errorText}`);
  }

  return response.json();
}

export async function supabaseDelete(table, filters = {}) {
  const response = await fetch(buildUrl(table, filters), {
    method: "DELETE",
    headers: buildHeaders({ method: "DELETE", prefer: "return=minimal" }),
    cache: "no-store"
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase delete failed for ${table}: ${errorText}`);
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
