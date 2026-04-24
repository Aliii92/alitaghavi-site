import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AreaPage({ params }) {
  const { area } = await params;
  redirect(`/listings/${area}`);
}
