import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/src/app/api/auth/[...nextauth]/route";
import { ProjectTools } from "@/src/components/project-tools";
import prisma from "@/src/lib/prisma";
import { Project as ProjectType } from "@/src/types/project";
interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  console.log("params:", params);

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const { projectId } = params;
  console.log("projectId:", projectId);

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  console.log("project:", project);

  if (!project) {
    console.log("project not found");
    notFound();
  }

  const projectWithoutNull = {
    id: project.externalId,
    name: project.name || undefined,
    description: project.description || undefined,
    status: project.status as ProjectType["status"],
  };

  return <ProjectTools project={projectWithoutNull} userId={session.user.id} />;
  // return (
  //     <div>Hello {projectId}</div>
  // )
}
