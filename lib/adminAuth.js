export const owners = {
  ali: {
    id: "ali",
    label: "Ali Taghavi",
    password: process.env.ALI_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "ali-admin"
  },
  negin: {
    id: "negin",
    label: "Negin Mohamadi",
    password: process.env.NEGIN_ADMIN_PASSWORD || "negin-admin"
  }
};

export function normalizeOwner(owner) {
  return owner === "negin" ? "negin" : "ali";
}

export function ownerFromPassword(password) {
  if (!password) return "";
  if (password === owners.ali.password) return "ali";
  if (password === owners.negin.password) return "negin";
  return "";
}

export function ownerFromRequest(request) {
  return ownerFromPassword(request.headers.get("x-admin-password"));
}

export function inferLeadOwner(lead = {}) {
  const haystack = [
    lead.owner,
    lead.advisor_name,
    lead.source_page,
    lead.whatsapp_target_number
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes("negin") || haystack.includes("971505996547") ? "negin" : "ali";
}

