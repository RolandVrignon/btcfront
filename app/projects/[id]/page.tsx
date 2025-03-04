import { ProjectTools } from "@/components/project-tools";
import { getProjectById } from "@/lib/projects";

export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProjectById(params.id);

  if (!project) {
    return <div>Projet non trouvé</div>;
  }

  return <ProjectTools project={project} />;
}
