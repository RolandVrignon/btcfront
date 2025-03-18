"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/src/components/sidebar";
import { ProjectStudy } from "@/src/components/project-study";
import {
  Project,
  UploadingFile,
  PublicDocumentList,
} from "@/src/types/project";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { searchPublicDocuments } from "@/src/components/project-study/utils/utils";

export default function DashboardPage() {
  const projectRef = useRef<Project | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { projectId } = useParams();
  const isFetchingProjectData = useRef(false);

  useEffect(() => {
    if (!userId) return;

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

  useEffect(() => {
    if (!project) {
      return;
    }

    if (isFetchingProjectData.current) {
      return;
    }

    // Démarrer la récupération des données
    isFetchingProjectData.current = true;
    fetchProjectData();

    async function fetchProjectData() {
      try {
        setIsProjectLoading(true);

        if (!project) {
          setIsProjectLoading(false);
          return;
        }

        setProject({
          ...project,
        });

        // 2. Récupérer les documents depuis l'API externe
        const documentsResponse = await fetch(
          `/api/documents/project/${project?.externalId}`,
        );

        if (!documentsResponse.ok) {
          console.error(
            "Erreur lors de la récupération des documents depuis l'API externe",
          );
          return;
        }

        const documentsData = await documentsResponse.json();

        // 3. Transformer les documents en format UploadingFile
        const files = documentsData.map((doc: Record<string, unknown>) => ({
          id: doc.id as string,
          status: doc.status as string,
          fileName: doc.filename as string,
          tags: Array.isArray(doc.ai_Type_document)
            ? [...doc.ai_Type_document]
            : [],
        }));

        // 4. Mettre à jour l'état des fichiers
        setUploadingFiles(files);
        setIsProjectLoading(false);

        if (
          (!project?.documents ||
            (project?.documents && project?.documents.length === 0)) &&
          project?.ai_city
        ) {
          const publicDocuments = await searchPublicDocuments(
            project.ai_city,
          );

          if (publicDocuments.length > 0) {
            setProject({
              ...project,
              documents: publicDocuments as PublicDocumentList,
            });
          }
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données du projet:",
          error,
        );
      } finally {
        // Réinitialiser le verrou
        isFetchingProjectData.current = false;
        setIsProjectLoading(false);
      }
    }
  }, [project]);

  return (
    <div className="flex h-screen">
      <Sidebar
        projectRef={projectRef}
        setProject={setProject}
        setUploadingFiles={setUploadingFiles}
        setSelectedFiles={setSelectedFiles}
        setIsUploading={setIsUploading}
        projects={projects}
        isLoading={isLoading}
        className="h-[100dvh]"
      />
      <main className="flex-1 overflow-auto">
        <ProjectStudy
          projectRef={projectRef}
          project={project}
          setProject={setProject}
          uploadingFiles={uploadingFiles}
          selectedFiles={selectedFiles}
          setUploadingFiles={setUploadingFiles}
          setSelectedFiles={setSelectedFiles}
          setProjects={setProjects}
          isUpperLoading={isProjectLoading}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
        />
      </main>
    </div>
  );
}
