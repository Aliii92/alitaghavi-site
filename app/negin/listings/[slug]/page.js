import AreaInventoryPage, {
  buildAreaMetadata,
  buildAreaStaticParams
} from "../../../../components/AreaInventoryPage";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const params = await buildAreaStaticParams("ready");
  return params.map(({ area }) => ({ slug: area }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return buildAreaMetadata(slug, "negin", "ready");
}

export default async function NeginListingsSlugPage({ params }) {
  const { slug } = await params;
  return <AreaInventoryPage params={{ area: slug }} owner="negin" inventoryType="ready" />;
}
