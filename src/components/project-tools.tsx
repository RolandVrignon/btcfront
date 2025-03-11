"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { FileUploadZone } from "@/src/components/file-upload-zone";
import { FileUploadList } from "@/src/components/file-upload-list";
import { Project } from "@/src/types/project";
import { usePresignedUrl } from "@/src/lib/hooks/use-presigned-url";
import { SelectedFilesList } from "@/src/components/selected-files-list";
import { UploadingFile } from "@/src/types/project";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ProjectMapDialog } from "@/src/components/project-map-dialog";
import { ProjectDetailsDialog } from "@/src/components/project-details-dialog";
import { Button } from "@/src/components/ui/button";
import { GoogleMapsIcon } from "@/src/components/ui/google-maps-icon";
import { Info } from "lucide-react";

import {
  FileText,
  GitCompare,
  Thermometer,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
} from "lucide-react";

interface ProjectToolsProps {
  project: Project | null;
  userId: string;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>> | null;
  isUpperLoading: boolean | null;
}
interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function ProjectTools({
  project: initialProject,
  userId,
  setProjects,
  isUpperLoading,
}: ProjectToolsProps) {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { getPresignedUrl } = usePresignedUrl();
  const [isLoading, setIsLoading] = useState(isUpperLoading);
  const isUploadingRef = useRef(false);

  const tools: Tool[] = [
    {
      id: "descriptif",
      name: "Descriptif sommaire des travaux",
      description:
        "Obtenir un descriptif sommaire des travaux décrits dans le/les CCTP, en vue de rédiger le RICT.",
      icon: <FileText className="h-12 w-12" />,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: "comparateur",
      name: "Comparateur d'indice",
      description:
        "Identifier les différences tant sur le fond (ajouts, suppression, modifications) que sur la forme des deux documents.",
      icon: <GitCompare className="h-12 w-12" />,
      color: "bg-green-100 text-green-700",
    },
    {
      id: "thermique",
      name: "Analyse Etude Thermique",
      description: "Analyse de la conformité de l'étude thermique.",
      icon: <Thermometer className="h-12 w-12" />,
      color: "bg-red-100 text-red-700",
    },
    {
      id: "incoherences",
      name: "Incohérences",
      description: "Détection des incohérences dans le projet.",
      icon: <AlertTriangle className="h-12 w-12" />,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: "suggestions",
      name: "Suggestions",
      description: "Propositions d'améliorations pour votre projet.",
      icon: <Lightbulb className="h-12 w-12" />,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  useEffect(() => {
    if (!initialProject) {
      console.log("project not existing:");
    } else {
      console.log("project:", initialProject);
      setProject(initialProject);
    }

    if (!initialProject) return;

    async function fetchProjectData() {
      try {
        setIsLoading(true);

        if (!initialProject) {
          setIsLoading(false);
          return;
        }

        // 2. Récupérer les documents depuis l'API externe
        const documentsResponse = await fetch(
          `/api/documents/project/${initialProject?.externalId}`,
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
        }));

        // 4. Mettre à jour l'état des fichiers
        setUploadingFiles(files);
        setIsLoading(false);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données du projet:",
          error,
        );
        setIsLoading(false);
      }
    }

    fetchProjectData();
  }, [initialProject]);

  useEffect(() => {
    if (isUpperLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isUpperLoading]);

  useEffect(() => {
    if (!uploadingFiles) return;
    console.log("uploadingFiles:", uploadingFiles);
  }, [uploadingFiles]);

  useEffect(() => {
    isUploadingRef.current = isUploading;
  }, [isUploading]);

  const createProject = async () => {
    try {
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du projet");
      }

      const data = await response.json();

      const obj = {
        id: data.id,
        name: data.name || "Nouveau projet",
        date: new Date().toISOString(),
        externalId: data.id,
        status: data.status,
      };

      // 3. Mettre à jour l'état local
      setProject(obj);

      return obj;
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      return null;
    }
  };

  // Modifier la fonction uploadFileToS3 pour utiliser à nouveau le proxy API mais avec suivi de progression
  const uploadFileToS3 = async (
    file: File,
    presignedUrl: string,
    fileId: string,
  ): Promise<boolean> => {
    try {
      // Créer un XMLHttpRequest pour pouvoir suivre la progression
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Écouter les événements de progression
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100,
            );

            // Mettre à jour la progression dans l'état
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      progress: percentComplete,
                      processingMessage: `Upload en cours: ${percentComplete}%`,
                    }
                  : f,
              ),
            );
          }
        });

        // Créer un FormData pour envoyer le fichier via notre proxy API
        const formData = new FormData();
        formData.append("file", file);
        formData.append("presignedUrl", presignedUrl);
        formData.append("contentType", file.type);

        // Configurer la requête vers notre proxy API au lieu de directement vers S3
        xhr.open("POST", "/api/storage/upload");

        // // Gérer la fin de la requête
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId
                    ? {
                        ...f,
                        progress: 100,
                        status: "processing",
                      }
                    : f,
                ),
              );

              resolve(true);
            } catch (error) {
              console.error("Erreur lors du parsing de la réponse:", error);
              reject(new Error("Erreur lors du parsing de la réponse"));
            }
          } else {
            console.error("Erreur lors de l'upload:", xhr.statusText);

            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error("Détails de l'erreur:", errorData);
            } catch (e) {
              console.error("Erreur lors du parsing de la réponse:", e);
            }

            // Mettre à jour le statut en cas d'erreur
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.id === fileId
                  ? {
                      ...f,
                      status: "error",
                      processingMessage: `Erreur HTTP: ${xhr.status}`,
                    }
                  : f,
              ),
            );

            reject(new Error(`Erreur HTTP: ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          console.error("Erreur réseau lors de l'upload");

          // Mettre à jour le statut en cas d'erreur réseau
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "error",
                    processingMessage: "Erreur réseau lors de l'upload",
                  }
                : f,
            ),
          );

          reject(new Error("Erreur réseau"));
        };

        // Envoyer le fichier
        xhr.send(formData);
      });
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier vers S3:", error);
      return false;
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);

    if (selectedFiles.length === 0) {
      console.error("Aucun fichier sélectionné");
      setIsUploading(false);
      return;
    }

    let projectId = project?.externalId;

    if (!project) {
      const newProject = await createProject();
      projectId = newProject?.externalId;

      if (!newProject) {
        console.error("Erreur lors de la création du projet");
        setIsUploading(false);
        return;
      } else {
        console.log("Projet créé avec succès:", newProject);
      }
    }

    try {
      // Créer un tableau pour suivre les uploads
      const uploadingFilesArray: UploadingFile[] = selectedFiles.map(
        (file) => ({
          file,
          id: file.name,
          fileName: file.name,
          progress: 0,
          status: "upload",
        }),
      );

      setUploadingFiles((prev) => [...prev, ...uploadingFilesArray]);
      setSelectedFiles([]);

      const uploadPromises = uploadingFilesArray.map(async (uploadingFile) => {
        try {
          // Obtenir l'URL présignée
          if (!uploadingFile.file) {
            throw new Error("Fichier manquant");
          }

          const presignedUrl = await getPresignedUrl(
            uploadingFile.file,
            projectId,
          );

          if (!presignedUrl) {
            throw new Error("Impossible d'obtenir l'URL présignée");
          }

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? {
                    ...f,
                    status: "upload",
                    progress: 0,
                    processingMessage: "Démarrage de l'upload...",
                  }
                : f,
            ),
          );

          // Uploader le fichier avec suivi de progression
          const uploadSuccess = await uploadFileToS3(
            uploadingFile.file,
            presignedUrl.url,
            uploadingFile.id,
          );

          if (!uploadSuccess) {
            throw new Error("Échec de l'upload");
          }

          return {
            fileName: uploadingFile.file.name,
            fileId: uploadingFile.id,
          };
        } catch (error) {
          console.error(
            `Erreur lors de l'upload du fichier ${uploadingFile}:`,
            error,
          );

          // Mettre à jour le statut en cas d'erreur
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id
                ? {
                    ...f,
                    status: "error",
                    processingMessage: "Erreur lors de l'upload",
                  }
                : f,
            ),
          );

          return null;
        }
      });

      // Attendre que tous les uploads soient terminés
      const results = await Promise.all(uploadPromises);

      const successfulUploads = results.filter(Boolean) as {
        fileName: string;
        fileId: string;
      }[];

      if (successfulUploads.length > 0) {
        await confirmMultipleUploadsToBackend(
          projectId,
          successfulUploads.map((u) => u.fileName),
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'upload des fichiers:", error);
    }
  };

  // Ajouter cette fonction pour récupérer l'ID d'un document par son nom de fichier
  const getDocumentIdByFileName = async (
    projectId: string,
    fileName: string,
  ): Promise<string | null> => {
    try {
      const response = await fetch("/api/documents/find-by-filename", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          fileName,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.id || null;
    } catch (error) {
      console.error(
        `Erreur lors de la recherche du document ${fileName}:`,
        error,
      );
      return null;
    }
  };

  // Modifier la fonction monitorProjectStatus pour utiliser un mécanisme de timeout basé sur le temps plutôt que sur le nombre de tentatives
  const monitorProjectStatus = async (
    projectId: string,
  ): Promise<Project | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        let isProcessingComplete = false;
        const startTime = Date.now();
        const timeoutDuration = 10 * 60 * 1000; // 10 minutes en millisecondes
        console.log("🔴 Début du monitoring du projet:", projectId);

        while (!isProcessingComplete && isUploadingRef.current) {
          // Vérifier si le timeout est atteint
          if (Date.now() - startTime > timeoutDuration) {
            console.warn(
              `Timeout atteint pour le projet ${projectId} après 10 minutes`,
            );
            reject(
              new Error(
                "Timeout: Le monitoring du projet a dépassé 10 minutes",
              ),
            );
            return;
          }

          // Attendre un peu entre chaque requête
          await new Promise((timeoutResolve) =>
            setTimeout(timeoutResolve, 2000),
          );

          // Récupérer le statut du projet
          const response = await fetch(`/api/projects/${projectId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            console.error("Erreur lors de la récupération du statut du projet");
            continue;
          }

          const projectData = await response.json();
          console.log(
            `🔴 Statut actuel du projet (temps écoulé: ${Math.floor((Date.now() - startTime) / 1000)}s):`,
            projectData.status,
          );

          // Vérifier si le traitement est terminé
          if (
            projectData.status === "COMPLETED" ||
            projectData.status === "ERROR"
          ) {
            console.log(
              "🔴 Traitement du projet terminé avec statut:",
              projectData.status,
            );
            isProcessingComplete = true;

            // Résoudre la promesse avec les données du projet
            resolve(projectData);
            setProject(projectData);
            if (setProjects) {
              setProjects((prev: Project[]) => [...prev, projectData]);
            }
            return;
          }
        }

        // Ce code est atteint seulement si on sort de la boucle while sans avoir résolu la promesse
        if (!isProcessingComplete) {
          if (!isUploadingRef.current) {
            console.log("Monitoring du projet interrompu par l'utilisateur");
            reject(new Error("Monitoring du projet interrompu"));
          } else {
            console.log("Fin du monitoring du projet sans résolution");
            reject(
              new Error("Monitoring du projet terminé sans résultat définitif"),
            );
          }
        }
      } catch (error) {
        console.error("Erreur lors du monitoring du projet:", error);
        reject(error);
      }
    });
  };

  // Modifier la fonction confirmMultipleUploadsToBackend pour utiliser la promesse
  const confirmMultipleUploadsToBackend = async (
    projectId: string | undefined,
    fileNames: string[],
  ) => {
    if (!projectId) {
      console.error("ID du projet manquant");
      return null;
    }

    try {
      const body = {
        projectId,
        fileNames,
      };

      console.log("body:", body);

      // Mettre à jour le statut des fichiers
      setUploadingFiles((prev) =>
        prev.map((f) => {
          const matchingFile = f.file && fileNames.includes(f.file.name);
          if (matchingFile) {
            return {
              ...f,
              status: "processing" as const,
            };
          }
          return f;
        }),
      );

      // Créer les promesses pour le traitement des documents
      const documentPromises = fileNames.map(async (fileName) => {
        let documentId: string | null = null;
        while (!documentId) {
          documentId = await getDocumentIdByFileName(projectId, fileName);
          if (!documentId) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }
        console.log("documentId:", documentId);

        if (documentId) {
          console.log("9️⃣ setUploadingFiles - Mise à jour de l'ID du document");

          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file && f.file.name === fileName
                ? {
                    ...f,
                    id: documentId,
                  }
                : f,
            ),
          );

          await monitorDocumentProcessing(
            documentId,
            projectId,
            setUploadingFiles,
            isUploadingRef,
          );
        }

        return { fileName, documentId };
      });

      // Fonction pour gérer tout le processus lié au projet
      const projectPromise = async () => {
        try {
          console.log("🔴 projectPromise - projectId:", projectId);

          // Vérifier si c'est le premier upload en récupérant l'état actuel du projet
          const projectResponse = await fetch(`/api/projects/${projectId}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          console.log("🔴 projectResponse:", projectResponse);

          if (!projectResponse) {
            console.error("Erreur lors de la récupération du projet");
            return null;
          }

          const currentProject = await projectResponse.json();
          console.log("🔴 currentProject:", currentProject);
          const isFirstUpload =
            !currentProject?.short_summary ||
            currentProject.short_summary === "";
          console.log("🔴 isFirstUpload:", isFirstUpload);

          // Si c'est le premier upload, démarrer le monitoring du projet
          if (isFirstUpload) {
            console.log(
              "🔴 Premier upload détecté, démarrage du monitoring du projet",
            );
            try {
              // Monitorer le projet jusqu'à ce qu'il soit terminé
              const finalProject = await monitorProjectStatus(projectId);
              console.log(
                "🔴 Monitoring du projet terminé avec succès:",
                finalProject,
              );
              return finalProject;
            } catch (error) {
              console.error("Erreur lors du monitoring du projet:", error);
              // En cas d'erreur, essayer de récupérer l'état actuel du projet
              return await handleProjectUpdate(projectId);
            }
          } else {
            // Si ce n'est pas le premier upload, simplement mettre à jour l'état du projet
            console.log(
              "Ce n'est pas le premier upload, mise à jour simple du projet",
            );
            const updatedProject = await handleProjectUpdate(projectId);
            setIsUploading(false);
            return updatedProject;
          }
        } catch (error) {
          console.error("Erreur dans le processus de projet:", error);
          setIsUploading(false);
          return null;
        }
      };

      // Attendre que les deux processus soient terminés en parallèle
      Promise.all([Promise.all(documentPromises), projectPromise()]);

      // Confirmer les uploads à l'API
      await fetch("/api/documents/confirm-multiple-uploads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error("Erreur lors de la confirmation des uploads:", error);
      setIsUploading(false);
      return null;
    }
  };

  const handleToolClick = (toolId: string) => {
    console.log(`Outil sélectionné: ${toolId}`);
    // Ici, vous pourriez naviguer vers une page spécifique à l'outil
    // ou ouvrir une modale, etc.
  };

  const handleProjectUpdate = async (projectId: string) => {
    console.log("handleProjectUpdate");

    console.log("url fetch:", `/api/projects/${projectId}`);

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Erreur lors de la récupération du projet");
        return null;
      }

      const data = await res.json();
      console.log("data:", data);

      setProject(data);
      return data;
    } catch (error) {
      console.error("Erreur lors de la récupération du projet:", error);
      return null;
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
        <div className="flex flex-col w-full rounded-[30px] relative p-4 gap-4 bg-gray-50">
          {!isLoading ? (
            <div className="flex flex-col gap-4 border-2 border-stone-200 justify-center items-center rounded-[20px] px-[5%] py-[4vh] relative">
              {!project ? (
                // Cas 1: Pas de projet - Appel à l'action
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
                    En savoir plus
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
              (file) => file.status && file.status.toLowerCase() === "ready",
            ) && (
              <div className="mt-4">
                <h3 className="text-xl font-semibold mb-4">
                  Outils disponibles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tools.map((tool) => (
                    <div
                      key={tool.id}
                      className={`rounded-xl p-4 cursor-pointer min-h-[25vh] transition-all hover:shadow-md ${tool.color} border border-transparent hover:border-current`}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full p-2 bg-white/80">
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-medium text-lg">
                            {tool.name}
                          </h4>
                          <p className="text-md opacity-80 mt-1 line-clamp-3">
                            {tool.description}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 self-center opacity-70" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
    </div>
  );
}

const monitorDocumentProcessing = async (
  documentId: string,
  projectId: string,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
  isUploadingRef: React.MutableRefObject<boolean>,
) => {
  try {
    let isProcessingComplete = false;
    const startTime = Date.now();
    const timeoutDuration = 10 * 60 * 1000; // 10 minutes en millisecondes

    while (!isProcessingComplete && isUploadingRef.current) {
      // Vérifier si le timeout est atteint
      if (Date.now() - startTime > timeoutDuration) {
        console.warn(
          `Timeout atteint pour le document ${documentId} après 10 minutes`,
        );
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === documentId
              ? {
                  ...f,
                  status: "error" as const,
                  processingMessage: "Timeout après 10 minutes de traitement",
                }
              : f,
          ),
        );
        return; // Sortir de la fonction
      }

      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await fetch("/api/documents/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId, projectId }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      const terminalStatuses = ["READY", "END", "ERROR"];

      const statusMap = {
        READY: "ready" as const,
        END: "ready" as const,
        ERROR: "error" as const,
        PROCESSING: "processing" as const,
        INDEXING: "indexing" as const,
        RAFTING: "rafting" as const,
        NOT_STARTED: "pending" as const,
      };

      const mappedStatus = statusMap[data.status as keyof typeof statusMap];

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === documentId
            ? {
                ...f,
                status: mappedStatus,
                processingMessage: data.processingMessage || undefined,
              }
            : f,
        ),
      );

      if (terminalStatuses.includes(data.status)) {
        isProcessingComplete = true;
      }
    }
  } catch (error) {
    console.error("Erreur lors du monitoring du document:", error);
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.id === documentId
          ? {
              ...f,
              status: "error" as const,
              processingMessage: "Erreur lors du monitoring du document",
            }
          : f,
      ),
    );
  }
};
