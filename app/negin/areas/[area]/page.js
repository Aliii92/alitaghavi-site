import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NeginAreaPage({ params }) {
  const { area } = await params;
  redirect(`/negin/listings/${area}`);
}
