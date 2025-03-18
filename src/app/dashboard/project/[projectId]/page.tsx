"use client";

import { useState, useEffect } from "react";
import { AceternitySidebar } from "@/src/components/sidebar";
import { ProjectTools } from "@/src/components/project-study";
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

    if (!userId) return;

    const fetchProjects = async () => {
      try {
        if (!userId) return;

        setIsProjectsLoading(true);

        const response = await fetch(`/api/projects/user/${userId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();

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
        setProject(data);
        setIsProjectLoading(false);
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };

    fetchProjects();
    fetchProject();
    // eslint-disable-next-line
  }, [userId]);

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
