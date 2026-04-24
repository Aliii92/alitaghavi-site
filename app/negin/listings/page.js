import PropertiesInventoryPage from "../../../components/PropertiesInventoryPage";

export const metadata = {
  title: "Dubai Property Search with Negin Mohamadi",
  description:
    "Search ready properties, off-plan projects, and resale off-plan opportunities through Negin Mohamadi's advisory flow.",
  alternates: {
    canonical: "/negin/listings"
  },
  openGraph: {
    title: "Dubai Property Search with Negin Mohamadi",
    description:
      "Search Dubai inventory across ready, off-plan, and resale off-plan categories inside Negin's flow.",
    url: "/negin/listings"
  }
};

export const dynamic = "force-dynamic";

export default function NeginListingsPage(props) {
  return <PropertiesInventoryPage {...props} owner="negin" inventoryType="all" />;
}
