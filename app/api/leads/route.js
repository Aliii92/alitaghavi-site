import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { inferLeadOwner, ownerFromRequest } from "../../../lib/adminAuth";

const leadsFile = path.join(process.cwd(), "data", "leads.json");

async function readLeads() {
  try {
    return JSON.parse(await fs.readFile(leadsFile, "utf8"));
  } catch {
    return [];
  }
}

async function writeLeads(leads) {
  await fs.mkdir(path.dirname(leadsFile), { recursive: true });
  await fs.writeFile(leadsFile, `${JSON.stringify(leads, null, 2)}\n`, "utf8");
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
  const payload = await request.json();
  const referrerUrl = payload.referrer_url || request.headers.get("referer") || "";
  const searchParams = new URL(referrerUrl || "https://local.invalid").searchParams;
  const leads = await readLeads();
  const lead = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    owner: inferLeadOwner(payload),
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

  leads.push(lead);
  await writeLeads(leads);

  return NextResponse.json(lead, { status: 201 });
}
