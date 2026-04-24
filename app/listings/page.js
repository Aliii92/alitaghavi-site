import PropertiesInventoryPage from "../../components/PropertiesInventoryPage";

export const metadata = {
  title: "Dubai Property Search",
  description:
    "Search ready properties, off-plan projects, and resale off-plan opportunities across Dubai from one shared inventory hub.",
  alternates: {
    canonical: "/listings"
  },
  openGraph: {
    title: "Dubai Property Search",
    description:
      "Search Dubai inventory across ready, off-plan, and resale off-plan categories.",
    url: "/listings"
  }
};

export const dynamic = "force-dynamic";

export default function ListingsPage(props) {
  return <PropertiesInventoryPage {...props} owner="ali" inventoryType="all" />;
}
