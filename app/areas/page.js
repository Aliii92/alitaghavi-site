import PropertiesInventoryPage from "../../components/PropertiesInventoryPage";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Areas in Dubai",
  description: "Browse Dubai areas dynamically based on available ready properties.",
  alternates: {
    canonical: "/areas"
  }
};

export default function AreasOverviewPage(props) {
  return <PropertiesInventoryPage {...props} owner="ali" inventoryType="ready" />;
}
