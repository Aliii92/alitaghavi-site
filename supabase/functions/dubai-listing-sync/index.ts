// Custom scoped-token authentication is intentional; this is not a public write API.
const SHEET_ID = '13juJ4IeafSrSy5zqBplMq2Ht26pobB0Aaz-PiksMwHI';
const TABS = new Set(['Super Luxury', 'Palm Jumeirah', 'Dubai', 'The Vally']);
const KEYS = ['source_id','source_tab','publish','area','building','property_type','bedrooms','size','price','view','category','status','handover'];
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
async function db(path: string, init: RequestInit = {}) {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/${path}`, { ...init, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' } });
}
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const token = req.headers.get('x-listing-sync-token') || '';
  if (!/^[a-f0-9]{64}$/.test(token)) return reply({ error: 'Unauthorized' }, 401);
  try {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)))).map(b => b.toString(16).padStart(2,'0')).join('');
    const config = await db('listing_sync_settings?singleton=eq.true&select=token_hash,enabled');
    if (!config.ok) return reply({ error: 'Sync unavailable' }, 503);
    const [settings] = await config.json();
    // Fixed-length constant-time comparison; never return or log the token/hash.
    const expected = settings?.token_hash || ''.padEnd(64,'0');
    let diff = hash.length ^ expected.length;
    for (let i=0;i<64;i++) diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0 || !settings) return reply({ error: 'Unauthorized' }, 401);
    if (!settings.enabled) return reply({ error: 'Sync is not enabled' }, 503);
    const text = await req.text();
    if (new TextEncoder().encode(text).length > 1500000) return reply({ error: 'Payload too large' }, 413);
    const body = JSON.parse(text);
    if (body.spreadsheet_id !== SHEET_ID || !Array.isArray(body.rows) || body.rows.length > 2000 || !Number.isFinite(Date.parse(body.sent_at))) return reply({ error: 'Invalid payload' }, 400);
    const seen = new Set();
    for (const r of body.rows) {
      if (!r || Object.keys(r).some(k => !KEYS.includes(k)) || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(r.source_id) || seen.has(r.source_id) || !TABS.has(r.source_tab) || typeof r.publish !== 'boolean') return reply({ error: 'Invalid or duplicate Website ID' },400);
      seen.add(r.source_id);
      if (KEYS.filter(k=>k!=='publish').some(k=>typeof r[k] !== 'string' || r[k].length>500)) return reply({ error: 'Invalid field' },400);
      if (r.publish && (!r.area.trim() || !r.building.trim() || !['ready','resale-off-plan'].includes(r.category) || !['Available','hidden','sold'].includes(r.status))) return reply({ error: 'Invalid property' },400);
    }
    const result = await db('rpc/apply_listing_sheet_sync',{ method:'POST',body:JSON.stringify({p_rows:body.rows,p_sent_at:body.sent_at}) });
    if (!result.ok) return reply({ error:'Sync was not applied; check IDs and database configuration' },409);
    return reply(await result.json());
  } catch { return reply({ error:'Sync failed; no success recorded' },500); }
});
