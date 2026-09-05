import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { inferLeadOwner, ownerFromRequest } from "../../../lib/adminAuth";
import { hasSupabaseServerConfig, supabaseSelect, supabaseUpsert } from "../../../lib/supabase-server.js";

const leadsFile = path.join(process.cwd(), "data", "leads.json");
const leadsTable = "leads";

async function readLocalLeads() {
  try {
    return JSON.parse(await fs.readFile(leadsFile, "utf8"));
  } catch {
    return [];
  }
}

async function writeLocalLeads(leads) {
  await fs.mkdir(path.dirname(leadsFile), { recursive: true });
  await fs.writeFile(leadsFile, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
}

async function readLeads() {
  if (!hasSupabaseServerConfig()) {
    if (process.env.NODE_ENV === "production") throw new Error("Lead storage unavailable");
    return readLocalLeads();
  }
  const rows = await supabaseSelect(leadsTable, { order: "created_at.desc" });
  return Array.isArray(rows) ? rows : [];
}
async function writeLead(lead) {
  if (!hasSupabaseServerConfig()) {
    if (process.env.NODE_ENV === "production") throw new Error("Lead storage unavailable");
    const leads = await readLocalLeads(); leads.push(lead); await writeLocalLeads(leads); return lead;
  }
  await supabaseUpsert(leadsTable, [lead], "id");
  return lead;
}

function getUtm(searchParams, key) {
  return searchParams.get(key) || "";
}

export async function GET(request) {
  const adminOwner = ownerFromRequest(request);
  if (!adminOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const leads = await readLeads();
  return NextResponse.json(
    leads
      .filter((lead) => inferLeadOwner(lead) === adminOwner)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  );
}

export async function POST(request) {
  let payload;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (JSON.stringify(payload).length > 12000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  payload = Object.fromEntries(Object.entries(payload).map(([key,value]) => [key, typeof value === "string" ? value.slice(0,3000) : ""]));
  const consultation = payload.lead_type === "consultation";
  if (consultation && (!String(payload.name || "").trim() || !/^[+0-9۰-۹٠-٩ ()-]{7,40}$/.test(String(payload.phone || "")))) {
    return NextResponse.json({ error: "Please provide your name and a valid phone number" }, { status: 400 });
  }
  if (consultation && payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.email))) return NextResponse.json({error:"Invalid email"},{status:400});
  const text = (key, max = 1000) => typeof payload[key] === "string" ? payload[key].trim().slice(0, max) : "";
  const referrerUrl = text("referrer_url", 2000) || request.headers.get("referer") || "";
  let searchParams = new URLSearchParams();
  try { searchParams = new URL(referrerUrl || "https://local.invalid").searchParams; } catch {}
  const lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    owner: inferLeadOwner(payload),
    lead_type: consultation ? "consultation" : "whatsapp_click",
    name: text("name", 120), email: text("email", 254), phone: text("phone", 40),
    purpose: text("purpose", 120), budget: text("budget", 120),
    status: "new",
    created_at: new Date().toISOString(),
    advisor_name: payload.advisor_name || "",
    source_page: payload.source_page || "",
    property_id: payload.property_id || "",
    property_title: payload.property_title || "",
    area: payload.area || "",
    building: payload.building || "",
    property_type: payload.property_type || "",
    bedrooms: payload.bedrooms || "",
    price: payload.price || "",
    language_mode: payload.language_mode || "EN",
    whatsapp_target_number: payload.whatsapp_target_number || "",
    message_preview: payload.message_preview || "",
    referrer_url: referrerUrl,
    user_agent: payload.user_agent || request.headers.get("user-agent") || "",
    utm_source: payload.utm_source || getUtm(searchParams, "utm_source") || "direct",
    utm_medium: payload.utm_medium || getUtm(searchParams, "utm_medium"),
    utm_campaign: payload.utm_campaign || getUtm(searchParams, "utm_campaign"),
    utm_content: payload.utm_content || getUtm(searchParams, "utm_content"),
    utm_term: payload.utm_term || getUtm(searchParams, "utm_term")
  };

  try { await writeLead(lead); } catch (error) { console.error("[leads:save]", error.message); return NextResponse.json({ error: "Could not save request. Please retry or contact us on WhatsApp." }, { status: 503 }); }

  return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
}


export async function PATCH(request) {
  if (!ownerFromRequest(request)) return NextResponse.json({error:"Unauthorized"},{status:401});
  try {
    const {id,status} = await request.json();
    if (!id || !["new","contacted","qualified","closed"].includes(status)) return NextResponse.json({error:"Invalid status"},{status:400});
    const lead = (await readLeads()).find(item => item.id === id);
    if (!lead) return NextResponse.json({error:"Lead not found"},{status:404});
    if (hasSupabaseServerConfig()) await supabaseUpsert(leadsTable,[{...lead,status}],"id");
    else { const leads = await readLocalLeads(); await writeLocalLeads(leads.map(item=>item.id === id ? {...item,status} : item)); }
    return NextResponse.json({success:true});
  } catch { return NextResponse.json({error:"Could not update lead"},{status:503}); }
}
