import { advisorForOwner } from "./advisors.js";

export function advisorFromPathname() {
  return "ali";
}

export function advisorFromLabel(advisor = "Ali") {
  const raw = String(advisor || "").toLowerCase();
  return raw.includes("ali") ? "ali" : "ali";
}

export function resolvePublicAdvisor() {
  return advisorForOwner("ali");
}

export function readyPropertiesPathFor() {
  return "/ready-properties";
}

export function offPlanProjectsPathFor() {
  return "/off-plan-projects";
}

export function resaleOffPlanPathFor() {
  return "/resale-off-plan";
}
