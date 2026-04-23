import { redirect } from "next/navigation";

export default function LegacyProjectsAdminRedirect() {
  redirect("/admin/ali/projects");
}

