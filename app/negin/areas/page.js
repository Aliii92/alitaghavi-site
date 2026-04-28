import PropertiesInventoryPage from "../../../components/PropertiesInventoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Areas in Dubai",
  description: "Browse Dubai areas dynamically based on available ready properties.",
  alternates: {
    canonical: "/negin/areas"
  }
};

export default function NeginAreasOverviewPage(props) {
  return <PropertiesInventoryPage {...props} owner="negin" inventoryType="ready" />;
}
