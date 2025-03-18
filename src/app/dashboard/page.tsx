"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/src/components/sidebar";
import { ProjectStudy } from "@/src/components/project-study";
import { Project, UploadingFile } from "@/src/types/project";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
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

        // Vérifier et mettre à jour le statut des projets qui ne sont pas terminés
        const updatedProjects = await Promise.all(
          data.map(async (project: Project) => {
            if (project.status !== "COMPLETED" && project.status !== "ERROR") {
              try {
                // Récupérer les dernières informations du projet depuis l'API externe
                const projectResponse = await fetch(
                  `/api/projects/${project.externalId}`,
                );
                if (projectResponse.ok) {
                  // La route s'occupe de mettre à jour la DB et retourne le projet à jour
                  return await projectResponse.json();
                }
              } catch (error) {
                console.error(
                  `Error updating project status for ${project.id}:`,
                  error,
                );
              }
            }
            return project;
          }),
        );

        setProjects(updatedProjects);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="flex h-screen">
      <Sidebar
        setProject={setProject}
        setUploadingFiles={setUploadingFiles}
        setSelectedFiles={setSelectedFiles}
        setIsUploading={setIsUploading}
        isLoading={isLoading}
        className="h-[100dvh]"
        projects={projects}
      />
      <main className="flex-1 overflow-auto">
        <ProjectStudy
          project={project}
          setProject={setProject}
          uploadingFiles={uploadingFiles}
          selectedFiles={selectedFiles}
          setUploadingFiles={setUploadingFiles}
          setSelectedFiles={setSelectedFiles}
          setProjects={setProjects}
          isUpperLoading={false}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
        />
      </main>
    </div>
  );
}
