"use client";

import { useState, useEffect } from "react";
import { AceternitySidebar } from "@/src/components/ui/aceternity-sidebar";
import { ProjectTools } from "@/src/components/project-tools";
import { Project } from "@/src/types/project";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!userId) return;

        setIsLoading(true);

        const response = await fetch(`/api/projects/user/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch projects");
        }
        const data = await response.json();
        setProjects(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="flex h-screen">
      <AceternitySidebar projects={projects} isLoading={isLoading} className="h-[100dvh]" />
      <main className="flex-1 overflow-auto">
        <ProjectTools project={null} userId={userId} setProjects={setProjects}/>
      </main>
    </div>
  );
}
