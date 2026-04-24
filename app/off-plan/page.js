import ProjectsInventoryPage from "../../components/ProjectsInventoryPage";

export const metadata = {
  title: "Off-Plan Projects in Dubai",
  description:
    "Explore curated off-plan projects across Dubai's luxury real estate market with private advisor guidance.",
  alternates: {
    canonical: "/off-plan-projects"
  }
};

export const dynamic = "force-dynamic";

export default async function OffPlanPage({ searchParams }) {
  return <ProjectsInventoryPage searchParams={searchParams} owner="ali" />;
}
