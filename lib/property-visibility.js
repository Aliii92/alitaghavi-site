export function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

export function isAvailableStatus(value) {
  const normalized = normalizeStatus(value);
  return !normalized || !["sold", "deleted", "hidden", "unavailable", "not-available", "withdrawn", "فروخته‌شده", "فروخته-شده"].includes(normalized);
}

export function isPubliclyVisibleProperty(property) {
  return isAvailableStatus(property?.status);
}
