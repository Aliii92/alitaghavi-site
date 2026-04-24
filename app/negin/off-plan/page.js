import ProjectsInventoryPage from "../../../components/ProjectsInventoryPage";

export const metadata = {
  title: "Off-Plan Projects with Negin Mohamadi",
  description:
    "Explore Dubai off-plan projects through Negin Mohamadi's advisory flow, with the full shared inventory and Negin contact routing.",
  alternates: {
    canonical: "/negin/projects"
  }
};

export const dynamic = "force-dynamic";

export default async function NeginOffPlanPage({ searchParams }) {
  return <ProjectsInventoryPage searchParams={searchParams} owner="negin" />;
}
