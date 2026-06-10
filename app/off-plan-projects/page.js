import ProjectsInventoryPage from "../../components/ProjectsInventoryPage";

export const metadata = {
  title: "Off-Plan Projects in Dubai",
  description: "Explore curated off-plan project inventory from Ali Taghavi across Dubai's luxury real estate market.",
  alternates: {
    canonical: "/off-plan-projects"
  }
};

export const dynamic = "force-dynamic";

export default async function OffPlanProjectsPage({ searchParams }) {
  return <ProjectsInventoryPage searchParams={searchParams} owner="ali" />;
}

