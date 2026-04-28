import AreaInventoryPage, {
  buildAreaMetadata,
  buildAreaStaticParams
} from "../../../components/AreaInventoryPage";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return buildAreaStaticParams("ready");
}

export async function generateMetadata({ params }) {
  const { area } = await params;
  return buildAreaMetadata(area, "ali", "ready");
}

export default async function AreaPage({ params }) {
  return <AreaInventoryPage params={params} owner="ali" inventoryType="ready" />;
}
