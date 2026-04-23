import { redirect } from "next/navigation";

export default function LegacyLeadsAdminRedirect() {
  redirect("/admin/ali/leads");
}

