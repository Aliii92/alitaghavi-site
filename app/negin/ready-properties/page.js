import PropertiesInventoryPage from "../../../components/PropertiesInventoryPage";

export const metadata = {
  title: "Ready Properties in Dubai",
  description:
    "Browse shared ready property inventory from Ali Taghavi and Negin Mohamadi across Dubai's prime areas.",
  alternates: {
    canonical: "/ready-properties"
  }
};

export const dynamic = "force-dynamic";

export default function NeginReadyPropertiesPage(props) {
  return <PropertiesInventoryPage {...props} owner="negin" inventoryType="ready" />;
}
