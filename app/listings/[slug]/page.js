import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ListingsSlugPage({ params }) {
  const { slug } = await params;
  redirect(`/areas/${slug}`);
}
