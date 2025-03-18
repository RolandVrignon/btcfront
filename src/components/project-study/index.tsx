"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { FileUploadZone } from "@/src/components/project-study/file-upload-zone";
import { FileUploadList } from "@/src/components/project-study/file-upload-list";
import { Project } from "@/src/types/project";
import { usePresignedUrl } from "@/src/lib/hooks/use-presigned-url";
import { SelectedFilesList } from "@/src/components/project-study/selected-files-list";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProjectMapDialog } from "@/src/components/project-study/dialogs/project-map-dialog";
import { ProjectDetailsDialog } from "@/src/components/project-study/dialogs/project-details-dialog";
import { Button } from "@/src/components/ui/button";
import { GoogleMapsIcon } from "@/src/components/ui/google-maps-icon";
import { Info } from "lucide-react";
import { UploadingFile } from "@/src/types/project";
import { ProjectToolsList } from "@/src/components/project-study/project-tools-list";
import { ProjectChatbot } from "./project-chatbot";
import { uploadAllFilesUtils, monitorDocumentProcessing } from "./utils";

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
}: ProjectToolsProps) {
  const { getPresignedUrl } = usePresignedUrl();
  const [isLoading, setIsLoading] = useState(true);

  const isUploadingRef = useRef(false);
  const isMonitoringRef = useRef(false);

  useEffect(() => {
    if (!project) return;
    if (!projectRef) return;

    if (project) {
      projectRef.current = project;
    }
  }, [project, projectRef]);

  useEffect(() => {
    if (isUpperLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isUpperLoading]);

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

    // Pour chaque fichier en cours de traitement, surveiller son statut
    uploadingFiles.forEach((file) => {
      if (file.status !== 'COMPLETED' && file.status !== 'ERROR' && file.id) {
        monitorDocumentProcessing(
          projectRef,
          file.id,
          project?.externalId || '',
          setUploadingFiles
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
      getPresignedUrl,
      setSelectedFiles,
    );
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
                <div className="pb-10 flex flex-col gap-4">
                  <h1 className="text-3xl font-bold">
                    {project.name || "Nouveau projet"}
                  </h1>
                  <h2 className="text-md font-light">
                    {project.short_summary}
                  </h2>
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
                // Cas 4: Projet en cours (DRAFT, PENDING, PROCESSING) - Skeleton
                <>
                  <div className="flex flex-col items-start pb-10 gap-3 w-full">
                    <Skeleton className="h-12 w-3/4 rounded-lg animate-pulse" />
                    <Skeleton className="h-8 w-full rounded-lg animate-pulse" />
                  </div>
                </>
              )}

              {/* Boutons d'action en bas à droite */}
              <div className="absolute bottom-1 right-1 flex items-center gap-2">
                {project &&
                  project.long_summary &&
                  project.documents &&
                  project.documents.length > 0 && (
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

                {project && project.ai_address && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center rounded-full bg-white hover:bg-blue-50"
                    onClick={() => {
                      // Ouvrir la dialog de carte
                      document.getElementById("map-dialog-trigger")?.click();
                    }}
                  >
                    <GoogleMapsIcon size={16} className="flex-shrink-0 mr-1" />
                    Ouvrir dans Maps
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

          {uploadingFiles.length > 0 &&
            uploadingFiles.every(
              (file) => file.status && file.status === "COMPLETED",
            ) && <ProjectChatbot />}

          {uploadingFiles.length > 0 &&
            uploadingFiles.every(
              (file) => file.status && file.status === "COMPLETED",
            ) && <ProjectToolsList projectId={project?.externalId} />}
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
    </div>
  );
}

export default ProjectStudy;
