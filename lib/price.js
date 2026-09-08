function extractNumericPrice(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const raw = String(value || "").replace(/[۰-۹]/g, c => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[٠-٩]/g, c => String("٠١٢٣٤٥٦٧٨٩".indexOf(c))).replace(/٬/g, "").replace(/٫/g, ".").trim();
  if (!raw) return 0;

  const normalized = raw
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/aed|درهم/g, "")
    .trim();

  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return 0;
  if (/(?:\d|\s)b\b|billion|میلیارد/.test(normalized)) return amount * 1000000000;
  if (/m|میلیون/.test(normalized)) return amount * 1000000;
  if (/k|هزار/.test(normalized)) return amount * 1000;
  return amount;
}

export function formatPriceDisplay(value, { locale = "en", currency = "AED" } = {}) {
  const amount = extractNumericPrice(value);
  if (!amount) {
    return locale === "fa" ? "قیمت هنگام درخواست" : "Price on request";
  }

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(amount);

  return `${currency} ${formatted}`;
}

export function getNumericPrice(value) {
  return extractNumericPrice(value);
}

