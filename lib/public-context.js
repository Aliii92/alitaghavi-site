import { advisorForOwner, normalizeAdvisorOwner } from "./advisors.js";

export function advisorFromPathname(pathname = "", fallbackOwner = "ali") {
  const normalizedPath = String(pathname || "");

  if (normalizedPath.startsWith("/negin") || normalizedPath.startsWith("/prime-areas/negin-")) {
    return "negin";
  }

  return normalizeAdvisorOwner(fallbackOwner);
}

export function advisorFromLabel(advisor = "Ali", fallbackOwner = "ali") {
  const raw = String(advisor || "").toLowerCase();
  if (raw.includes("negin")) return "negin";
  if (raw.includes("ali")) return "ali";
  return normalizeAdvisorOwner(fallbackOwner);
}

export function resolvePublicAdvisor({ advisorOwner, advisor, pathname, fallbackOwner = "ali" } = {}) {
  const resolvedOwner =
    advisorOwner || (pathname ? advisorFromPathname(pathname, fallbackOwner) : advisorFromLabel(advisor, fallbackOwner));

  return advisorForOwner(resolvedOwner, fallbackOwner);
}

export function readyPropertiesPathFor(owner = "ali") {
  return normalizeAdvisorOwner(owner) === "negin" ? "/negin/ready-properties" : "/ready-properties";
}

export function offPlanProjectsPathFor(owner = "ali") {
  return normalizeAdvisorOwner(owner) === "negin" ? "/negin/off-plan" : "/off-plan-projects";
}

export function resaleOffPlanPathFor(owner = "ali") {
  return normalizeAdvisorOwner(owner) === "negin" ? "/negin/resale-off-plan" : "/resale-off-plan";
}
