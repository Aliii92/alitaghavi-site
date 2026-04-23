import AreaInventoryPage, {
  buildAreaMetadata,
  buildAreaStaticParams
} from "../../../../components/AreaInventoryPage";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return buildAreaStaticParams("resale-off-plan");
}

export async function generateMetadata({ params }) {
  const { area } = await params;
  return buildAreaMetadata(area, "negin", "resale-off-plan");
}

export default function NeginResaleOffPlanAreaPage(props) {
  return <AreaInventoryPage {...props} owner="negin" inventoryType="resale-off-plan" />;
}
