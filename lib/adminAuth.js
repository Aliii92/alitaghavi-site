export const owners = {
  ali: {
    id: "ali",
    label: "Ali Taghavi",
    password: process.env.ALI_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "ali-admin"
  }
};

export function normalizeOwner() {
  return "ali";
}

export function ownerFromPassword(password) {
  if (!password) return "";
  return password === owners.ali.password ? "ali" : "";
}

export function ownerFromRequest(request) {
  return ownerFromPassword(request.headers.get("x-admin-password"));
}

export function inferLeadOwner() {
  return "ali";
}
