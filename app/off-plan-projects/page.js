import ProjectsInventoryPage from "../../components/ProjectsInventoryPage";

export const metadata = {
  title: "Off-Plan Projects in Dubai",
  description:
    "Explore shared off-plan project inventory from Ali Taghavi and Negin Mohamadi across Dubai's luxury real estate market.",
  alternates: {
    canonical: "/off-plan-projects"
  }
};

export const dynamic = "force-dynamic";

export default async function OffPlanProjectsPage({ searchParams }) {
  return <ProjectsInventoryPage searchParams={searchParams} owner="ali" />;
}
