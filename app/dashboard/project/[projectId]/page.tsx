import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ProjectTools } from "@/components/project-tools";
import prisma from "@/lib/prisma";
import { Project as ProjectType } from "@/types/project";

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
    notFound();
  }

  const projectWithoutNull = {
    id: project.id,
    name: project.name || undefined,
    description: project.description || undefined,
    status: project.status as ProjectType["status"],
  };

  return <ProjectTools project={projectWithoutNull} userId={session.user.id} />;
}
