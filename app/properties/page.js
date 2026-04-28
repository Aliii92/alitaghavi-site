import PropertiesInventoryPage from "../../components/PropertiesInventoryPage";

export const metadata = {
  title: "Properties in Dubai",
  description: "Browse ready properties across Dubai from the shared live inventory.",
  alternates: {
    canonical: "/properties"
  }
};

export const dynamic = "force-dynamic";

export default function PropertiesPage(props) {
  return <PropertiesInventoryPage {...props} owner="ali" inventoryType="ready" />;
}
