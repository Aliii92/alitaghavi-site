import AreaInventoryPage, {
  buildAreaMetadata,
  buildAreaStaticParams
} from "../../../../components/AreaInventoryPage";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return buildAreaStaticParams("ready");
}

export async function generateMetadata({ params }) {
  const { area } = await params;
  return buildAreaMetadata(area, "negin", "ready");
}

export default function NeginAreaPage(props) {
  return <AreaInventoryPage {...props} owner="negin" inventoryType="ready" />;
}
