import PropertiesInventoryPage from "../../components/PropertiesInventoryPage";

export const metadata = {
  title: "Resale Off-Plan in Dubai",
  description:
    "Browse curated resale off-plan inventory from Ali Taghavi and Negin Mohamadi across Dubai's prime areas.",
  alternates: {
    canonical: "/resale-off-plan"
  },
  openGraph: {
    title: "Resale Off-Plan in Dubai",
    description:
      "Explore shared resale off-plan inventory across Dubai with advisor-led guidance.",
    url: "/resale-off-plan"
  }
};

export const dynamic = "force-dynamic";

export default function ResaleOffPlanPage(props) {
  return <PropertiesInventoryPage {...props} owner="ali" inventoryType="resale-off-plan" />;
}
