import ProjectsInventoryPage from "../../components/ProjectsInventoryPage";

export const metadata = {
  title: "Off-Plan Projects in Dubai",
  description:
    "Explore curated off-plan projects in Dubai's luxury and branded real estate market with advisor-led selection support.",
  alternates: {
    canonical: "/off-plan-projects"
  },
  openGraph: {
    title: "Off-Plan Projects in Dubai",
    description:
      "Explore curated Dubai off-plan projects with premium advisory guidance.",
    url: "/off-plan-projects"
  }
};

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }) {
  return <ProjectsInventoryPage searchParams={searchParams} owner="ali" />;
}

