import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NeginListingsSlugPage({ params }) {
  const { slug } = await params;
  redirect(`/negin/areas/${slug}`);
}
