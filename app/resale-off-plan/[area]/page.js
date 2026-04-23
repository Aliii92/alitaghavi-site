import AreaInventoryPage, {
  buildAreaMetadata,
  buildAreaStaticParams
} from "../../../components/AreaInventoryPage";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return buildAreaStaticParams("resale-off-plan");
}

export async function generateMetadata({ params }) {
  const { area } = await params;
  return buildAreaMetadata(area, "ali", "resale-off-plan");
}

export default function ResaleOffPlanAreaPage(props) {
  return <AreaInventoryPage {...props} owner="ali" inventoryType="resale-off-plan" />;
}
