import PropertiesInventoryPage from "../../components/PropertiesInventoryPage";

export const metadata = {
  title: "Ready Properties in Dubai",
  description:
    "Browse curated ready homes across Dubai for end-users and investors, organized by prime areas and branded addresses.",
  alternates: {
    canonical: "/ready-properties"
  }
};

export const dynamic = "force-dynamic";

export default function ReadyPropertiesPage(props) {
  return <PropertiesInventoryPage {...props} owner="ali" inventoryType="ready" />;
}
