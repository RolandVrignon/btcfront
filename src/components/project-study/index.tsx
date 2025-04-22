"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { FileUploadZone } from "@/src/components/project-study/components/file-upload-zone";
import { FileUploadList } from "@/src/components/project-study/components/file-upload-list";
import { Project } from "@/src/types/type";
import { useBucketUrl } from "@/src/lib/hooks/use-presigned-url";
import { SelectedFilesList } from "@/src/components/project-study/components/selected-files-list";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProjectMapDialog } from "@/src/components/project-study/dialogs/project-map-dialog";
import { ProjectDetailsDialog } from "@/src/components/project-study/dialogs/project-details-dialog";
import { Button } from "@/src/components/ui/button";
import { GoogleMapsIcon } from "@/src/components/ui/google-maps-icon";
import { Info, Pencil } from "lucide-react";
import { UploadingFile } from "@/src/types/type";
import { ProjectToolsList } from "@/src/components/project-study/components/project-tools-list";
import { ProjectChatbot } from "./components/project-chatbot";
import {
  uploadAllFilesUtils,
  monitorDocumentProcessing,
  monitorProjectStatus,
} from "./utils/utils";
import { TypewriterTitle } from "@/src/components/ui/typewriterTitle";
import { LoadingSpinner } from "../ui/loading-spinner";
import { AddressEditDialog } from "@/src/components/project-study/dialogs/address-edit-dialog";

interface ProjectToolsProps {
  project: Project | null;
  projectRef: React.MutableRefObject<Project | null>;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  uploadingFiles: UploadingFile[];
  selectedFiles: File[];
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  isUpperLoading: boolean;
  isUploading: boolean;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  isProjectSelected: boolean;
}

export function ProjectStudy({
  project,
  projectRef,
  setProject,
  uploadingFiles,
  selectedFiles,
  setUploadingFiles,
  setSelectedFiles,
  setProjects,
  isUploading,
  setIsUploading,
  isUpperLoading,
  isProjectSelected,
}: ProjectToolsProps) {
  const { getUploadUrl, getDownloadUrl } = useBucketUrl();
  const [isLoading, setIsLoading] = useState(true);

  const isUploadingRef = useRef(false);
  const isMonitoringRef = useRef(false);

  // Mettre à jour le projet dans le ref et surveiller son statut s'il n'est pas terminé
  useEffect(() => {
    if (!project) return;
    if (!projectRef) return;

    if (project) {
      projectRef.current = project;
    }

    if (!isProjectSelected) return;

    if (!setProject) return;

    if (
      projectRef.current?.status !== "COMPLETED" &&
      projectRef.current?.status !== "ERROR"
    ) {
      monitorProjectStatus(
        projectRef,
        projectRef.current?.externalId || "",
        setProject,
      );
    }
  }, [project, projectRef, setProject, isProjectSelected]);

  useEffect(() => {
    if (isUpperLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isUpperLoading]);

  // Surveiller le statut des fichiers en cours de traitement
  useEffect(() => {
    if (!uploadingFiles) return;
    if (!uploadingFiles.length) return;
    if (!project) return;
    if (!project.externalId) return;
    if (!setUploadingFiles) return;
    if (!isUploadingRef) return;
    if (!projectRef.current) return;
    if (isMonitoringRef.current) return;
    isMonitoringRef.current = true;

    uploadingFiles.forEach((file) => {
      if (
        file.status !== "COMPLETED" &&
        file.status !== "ERROR" &&
        file.status !== "UPLOAD" &&
        file.id
      ) {
        monitorDocumentProcessing(
          projectRef,
          file.id,
          project?.externalId || "",
          setUploadingFiles,
        );
      }
    });
  }, [uploadingFiles, setUploadingFiles, project, isUploadingRef, projectRef]);

  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllFiles = async () => {
    uploadAllFilesUtils(
      projectRef,
      selectedFiles,
      setUploadingFiles,
      setProject,
      setProjects,
      setIsUploading,
      project,
      getUploadUrl,
      getDownloadUrl,
      setSelectedFiles,
    );
  };

  const updateProject = async (updatedProject: Partial<Project>) => {
    if (!project || !project.externalId) return;

    try {
      setProject((prevProject) => {
        if (!prevProject) return updatedProject;
        return { ...prevProject, ...updatedProject };
      });

      // Update ref
      if (projectRef && projectRef.current) {
        projectRef.current = { ...projectRef.current, ...updatedProject };
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  };

  return (
    <div className="flex flex-col w-full h-full overflow-auto overflow-x-hidden border-top-left border-l-2 bg-gray-50">
      <div className="banner h-[50vh] w-full relative flex-shrink-0">
        <Image
          src="/assets/img/bg.jpg"
          alt="Bannière d'arrière-plan"
          fill
          priority
          className="object-cover border-tl-radius-xl"
          sizes="100vw"
        />
      </div>

      <div className="mt-[-35vh] pb-[30vh] inset-0 m-auto w-full px-40 max-w-[1200px]">
        <div className="flex flex-col w-full rounded-3xl relative p-4 gap-4 bg-gray-50">
          {!isLoading ? (
            <div className="flex flex-col gap-4 border-2 border-stone-200 justify-center items-center rounded-xl px-[5%] py-[4vh] relative">
              {!project ? (
                <>
                  <h1 className="text-3xl font-bold text-center">
                    BTP Consultants IA
                  </h1>
                  <div className="flex flex-col items-center gap-3 text-center">
                    <h2 className="text-md font-light">
                      Votre boîte à outils pour le Contrôle Technique
                    </h2>
                    <p className="text-blue-600 mt-2 max-w-md">
                      Déposez vos premiers fichiers pour une analyse métier
                      complète.
                    </p>
                  </div>
                </>
              ) : project.status === "COMPLETED" ? (
                // Cas 2: Projet terminé - Affichage du titre et du résumé
                <div className="pb-5 flex flex-col gap-4">
                  <h1 className="text-3xl font-bold">
                    {project.name || "Nouveau projet"}
                  </h1>
                  <h2 className="text-md font-light">
                    {project.short_summary}
                  </h2>
                  <div
                    className="flex flex-col border-2 border-stone-200 rounded-xl p-4 relative group cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      document
                        .getElementById("address-edit-dialog-trigger")
                        ?.click();
                    }}
                  >
                    <div className="absolute top-2 right-2 p-1 rounded-full">
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </div>
                    <h3 className="text-md font-medium">
                      {project.closest_formatted_address}
                    </h3>
                    <div className="flex items-center">
                      <GoogleMapsIcon className="h-4 w-4 text-gray-500" />
                      <h3 className="text-md font-light">
                        {project.latitude}, {project.longitude}
                      </h3>
                    </div>
                  </div>
                </div>
              ) : project.status === "ERROR" ? (
                // Cas 3: Projet en erreur - Message d'erreur
                <>
                  <h1 className="text-3xl font-bold text-red-600">
                    {project.name || "Nouveau projet"}
                  </h1>
                  <h2 className="text-md font-light text-center text-red-600">
                    Une erreur est survenue lors du traitement de ce projet.
                    Veuillez réessayer ou contacter le support.
                  </h2>
                </>
              ) : (
                <div className="flex flex-col gap-4 w-full justify-start">
                  <div className="inline-flex w-fit items-center text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full whitespace-nowrap">
                    <LoadingSpinner />
                    Extraction des métadonnées du projet
                  </div>
                  <TypewriterTitle className="font-lg text-3xl text-[#0A0A0A] rounded-full" />
                </div>
              )}

              {/* Boutons d'action en bas à droite */}
              <div className="absolute bottom-1 right-1 flex items-center gap-2">
                {project && project.long_summary && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center rounded-full bg-white hover:bg-blue-50"
                    onClick={() => {
                      // Ouvrir la dialog de détails
                      document
                        .getElementById("details-dialog-trigger")
                        ?.click();
                    }}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Données publiques
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Skeleton className="rounded-[20px] h-[20vh] w-full" />
          )}

          <div className="flex flex-col items-center gap-4">
            <FileUploadZone
              files={uploadingFiles}
              onFilesSelected={handleFilesSelected}
            />

            {selectedFiles.length > 0 && (
              <SelectedFilesList
                files={selectedFiles}
                onRemove={removeSelectedFile}
                onUploadAll={uploadAllFiles}
                isUploading={isUploading}
              />
            )}

            {(uploadingFiles.length > 0 || isLoading) && (
              <FileUploadList
                files={uploadingFiles}
                projectId={project?.externalId}
                isLoading={isLoading}
              />
            )}
          </div>

          {uploadingFiles.length > 0 && (
            <ProjectChatbot
              projectId={project?.externalId}
              isIndexationCompleted={
                uploadingFiles.length > 0 &&
                uploadingFiles.every(
                  (file) =>
                    file.indexation_status &&
                    file.indexation_status === "COMPLETED",
                )
              }
            />
          )}

          {uploadingFiles.length > 0 && (
            <ProjectToolsList
              projectId={project?.externalId}
              isToolsReady={
                uploadingFiles.length > 0 &&
                uploadingFiles.every(
                  (file) => file.status && file.status === "COMPLETED",
                )
              }
              uploadFiles={uploadingFiles}
            />
          )}
        </div>
      </div>

      {/* Afficher le bouton de carte uniquement si le projet existe et a une adresse */}
      {!isLoading && project && project.ai_address && (
        <ProjectMapDialog project={project} />
      )}

      {/* Afficher la modale de détails du projet */}
      {!isLoading && project && project.long_summary && (
        <ProjectDetailsDialog project={project} />
      )}

      {/* Ajouter la modale d'édition d'adresse */}
      {!isLoading && project && (
        <AddressEditDialog project={project} updateProject={updateProject} />
      )}
    </div>
  );
}

export default ProjectStudy;
