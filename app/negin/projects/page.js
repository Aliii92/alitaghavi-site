import ProjectsInventoryPage from "../../../components/ProjectsInventoryPage";

export const metadata = {
  title: "Off-Plan Projects with Negin Mohamadi",
  description:
    "Explore Dubai off-plan projects through Negin Mohamadi's advisory flow, with the full shared inventory and Negin contact routing.",
  alternates: {
    canonical: "/negin/projects"
  },
  openGraph: {
    title: "Off-Plan Projects with Negin Mohamadi",
    description:
      "Browse shared Dubai off-plan projects inside Negin Mohamadi's advisory flow.",
    url: "/negin/projects"
  }
};

export const dynamic = "force-dynamic";

export default async function NeginProjectsPage({ searchParams }) {
  return <ProjectsInventoryPage searchParams={searchParams} owner="negin" />;
}

