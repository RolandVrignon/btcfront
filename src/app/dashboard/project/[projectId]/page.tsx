"use client";

import { useState, useEffect } from "react";
import { AceternitySidebar } from "@/src/components/ui/aceternity-sidebar";
import { ProjectTools } from "@/src/components/project-tools";
import { Project } from "@/src/types/project";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { projectId } = useParams();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!userId) return;

        setIsProjectsLoading(true);

        const response = await fetch(`/api/projects/user/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();

        // Log projects with their createdAt dates for verification
        console.log(
          "Projects sorted by createdAt:",
          data.map((project: { name: string; createdAt: string }) => ({
            name: project.name,
            createdAt: project.createdAt,
          })),
        );

        setProjects(data);
        setIsProjectsLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    const fetchProject = async () => {
      try {
        if (!projectId) return;

        setIsProjectLoading(true);

        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }
        const data = await response.json();
        console.log("data:", data);
        setProject(data);
        setIsProjectLoading(false);
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };

    fetchProjects();
    fetchProject();
    // eslint-disable-next-line
  }, []);

  if (!userId) return null;

  return (
    <div className="flex h-screen">
      <AceternitySidebar
        projects={projects}
        isLoading={isProjectsLoading}
        className="h-[100dvh]"
      />
      <main className="flex-1 overflow-auto">
        <ProjectTools
          project={project}
          setProjects={setProjects}
          isUpperLoading={isProjectLoading}
        />
      </main>
    </div>
  );
}
