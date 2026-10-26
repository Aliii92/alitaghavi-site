import test from "node:test";
import assert from "node:assert/strict";
import { canonicalPropertyArea, matchesPropertyArea, matchesPropertyQuery, normalizeSearchText } from "../lib/property-search.js";
import { safePropertyReturnPath } from "../lib/property-return-path.js";
import { getPropertyImage } from "../lib/get-image-src.js";
import { localizePath } from "../lib/locale.js";

test("Persian area aliases match English listings without matching unrelated listings", () => {
  const downtown = { area: "Downtown Dubai", building: "Act One Act Two", bedrooms: "2" };
  const palm = { area: "Palm Jumeirah", building: "Serenia Residences" };
  assert.ok(matchesPropertyQuery(downtown, "داون‌تاون"));
  assert.ok(matchesPropertyQuery(downtown, "داون تاون"));
  assert.ok(matchesPropertyQuery(palm, "پالم جمیرا"));
  assert.ok(!matchesPropertyQuery(palm, "داون تاون"));
  assert.ok(matchesPropertyQuery(downtown, "Act One"));
  assert.ok(!matchesPropertyQuery(downtown, "Opera Grand"));
});

test("area picker groups common aliases, but respects other neighborhoods", () => {
  assert.equal(canonicalPropertyArea("Downtown Dubai"), "downtown");
  assert.equal(normalizeSearchText("  دَاوْن‌تاون "), "داون تاون");
  assert.ok(matchesPropertyArea("Downtown Dubai", "Downtown"));
  assert.ok(matchesPropertyArea("The Valley", "د ولی"));
  assert.ok(!matchesPropertyArea("Zabeel", "Downtown"));
  assert.ok(matchesPropertyArea("Zabeel", "all"));
});

test("Persian routes and the original filtered search survive property detail navigation", () => {
  assert.equal(localizePath("/ready-properties", "fa"), "/fa/ready-properties");
  assert.equal(localizePath("/fa/listings", "fa"), "/fa/listings");
  const original = "/fa/ready-properties?area=downtown&bedrooms=2&max_price=4000000";
  assert.equal(safePropertyReturnPath(original, "fa"), original);
  assert.equal(safePropertyReturnPath("/listings?q=Downtown", "fa"), "/fa/listings?q=Downtown");
  assert.equal(safePropertyReturnPath("/areas/downtown", "en"), "/areas/downtown");
});

test("malicious or unrelated return destinations are rejected", () => {
  assert.equal(safePropertyReturnPath("https://evil.example", "en"), "/listings");
  assert.equal(safePropertyReturnPath("//evil.example", "en"), "/listings");
  assert.equal(safePropertyReturnPath("/\\evil.example", "en"), "/listings");
  assert.equal(safePropertyReturnPath("/admin?foo=bar", "fa"), "/fa/listings");
  assert.equal(safePropertyReturnPath(["/listings"], "en"), "/listings");
});

test("properties without unit photos show a neutral, honest image", () => {
  const placeholder = getPropertyImage({});
  assert.ok(placeholder.startsWith("data:image/svg+xml"));
  assert.equal(getPropertyImage({ image_url: "/uploads/actual-unit.jpg" }), "/uploads/actual-unit.jpg");
});
