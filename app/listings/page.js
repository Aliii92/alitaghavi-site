import PropertiesInventoryPage from "../../components/PropertiesInventoryPage";

export const metadata = {
  title: "Ready Properties in Dubai",
  description:
    "Browse shared ready property inventory from Ali Taghavi and Negin Mohamadi across Dubai's prime areas.",
  alternates: {
    canonical: "/ready-properties"
  },
  openGraph: {
    title: "Ready Properties in Dubai",
    description:
      "Browse shared ready property inventory across Dubai's prime areas with advisor-led guidance.",
    url: "/ready-properties"
  }
};

export const dynamic = "force-dynamic";

export default function ListingsPage(props) {
  return <PropertiesInventoryPage {...props} owner="ali" inventoryType="ready" />;
}
