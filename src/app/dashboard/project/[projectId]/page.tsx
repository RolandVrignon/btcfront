import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/src/lib/auth";
import { ProjectTools } from "@/src/components/project-tools";
import prisma from "@/src/lib/prisma";
import { Project as ProjectType } from "@/src/types/project";
interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const { projectId } = await params;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    console.log("project not found");
    notFound();
  }

  // Récupérer les informations complètes du projet depuis l'API externe
  const apiResponse = await fetch(
    `${process.env.NEXT_PUBLIC_CTIA_API_URL}/projects/${project.externalId}`,
    {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      next: { revalidate: 60 },
    },
  );

  let extendedProject = {};

  if (apiResponse.ok) {
    extendedProject = await apiResponse.json();
    console.log("Données du projet depuis l'API externe:", extendedProject);
  } else {
    console.error(
      "Erreur lors de la récupération des données depuis l'API externe",
    );
  }

  const projectWithoutNull = {
    id: project.externalId,
    name: project.name || undefined,
    short_summary: project.short_summary || undefined,
    long_summary: project.long_summary || undefined,
    status: project.status as ProjectType["status"],
    ai_address: project.ai_address || undefined,
    ai_city: project.ai_city || undefined,
    ai_zip_code: project.ai_zip_code || undefined,
    ai_country: project.ai_country || undefined,
    ...extendedProject,
  };

  return <ProjectTools project={projectWithoutNull} userId={session.user.id} setProjects={null} />;
}
