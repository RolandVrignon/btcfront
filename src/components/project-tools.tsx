"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FileUploadZone } from "@/src/components/file-upload-zone";
import { FileUploadList } from "@/src/components/file-upload-list";
import { Project } from "@/src/types/project";
import { usePresignedUrl } from "@/src/lib/hooks/use-presigned-url";
import { SelectedFilesList } from "@/src/components/selected-files-list";
import { UploadingFile } from "@/src/types/project";

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
}: ProjectToolsProps) {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { getPresignedUrl } = usePresignedUrl();

  const tools: Tool[] = [
    {
      id: "descriptif",
      name: "Descriptif sommaire des travaux",
      description:
        "Obtenir un descriptif sommaire des travaux décrits dans le/les CCTP, en vue de rédiger le RICT.",
      icon: <FileText className="h-8 w-8" />,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: "comparateur",
      name: "Comparateur d'indice",
      description:
        "Identifier les différences tant sur le fond (ajouts, suppression, modifications) que sur la forme des deux documents.",
      icon: <GitCompare className="h-8 w-8" />,
      color: "bg-green-100 text-green-700",
    },
    {
      id: "thermique",
      name: "Analyse Etude Thermique",
      description: "Analyse de la conformité de l'étude thermique.",
      icon: <Thermometer className="h-8 w-8" />,
      color: "bg-red-100 text-red-700",
    },
    {
      id: "incoherences",
      name: "Incohérences",
      description: "Détection des incohérences dans le projet.",
      icon: <AlertTriangle className="h-8 w-8" />,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: "suggestions",
      name: "Suggestions",
      description: "Propositions d'améliorations pour votre projet.",
      icon: <Lightbulb className="h-8 w-8" />,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  useEffect(() => {
    if (!project) return;
    console.log("project:", project);
  }, [project]);

  useEffect(() => {
    if (!uploadingFiles) return;
    console.log("uploadingFiles:", uploadingFiles);
  }, [uploadingFiles]);

  useEffect(() => {
    if (!project) return;

    async function fetchProjectData() {
      try {
        // 1. Récupérer l'externalId depuis notre base de données
        if (!project) return;

        // 2. Récupérer les documents depuis l'API externe
        const documentsResponse = await fetch(
          `/api/documents/project/${project.id}`,
        );

        if (!documentsResponse.ok) {
          console.error(
            "Erreur lors de la récupération des documents depuis l'API externe",
          );
          return;
        }

        const documentsData = await documentsResponse.json();
        console.log("documentsData:", documentsData);

        // 3. Transformer les documents en format UploadingFile
        const files = documentsData.map((doc: Record<string, unknown>) => ({
          id: doc.id as string,
          status: doc.status as string,
          fileName: doc.filename as string,
        }));

        // 4. Mettre à jour l'état des fichiers
        setUploadingFiles(files);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données du projet:",
          error,
        );
      }
    }

    fetchProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      console.log("Projet créé dans l'API externe:", data);

      if (userId) {
        const dbResponse = await fetch("/api/projects", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            externalId: data.id,
            name: data.name || "Nouveau projet",
            status:
              data.status === "DRAFT" ? "draft" : data.status.toLowerCase(),
            userId: userId,
          }),
        });

        if (!dbResponse.ok) {
          console.error(
            "Erreur lors de l'enregistrement du projet dans la base de données locale",
          );
        } else {
          console.log("Projet enregistré dans la base de données locale");
        }
      }

      // 3. Mettre à jour l'état local
      setProject({
        id: data.id,
        name: data.name || "Nouveau projet",
        date: new Date().toISOString(),
      });

      return {
        id: data.id,
        name: data.name || "Nouveau projet",
        date: new Date().toISOString(),
      };
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
      console.log("Début de l'upload vers S3 via proxy");
      console.log("Type de fichier:", file.type);
      console.log("Taille du fichier:", file.size, "bytes");

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
            console.log("1️⃣ setUploadingFiles - Mise à jour de la progression");
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

        // Gérer la fin de la requête
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const result = JSON.parse(xhr.responseText);
              console.log("Upload réussi:", result.message);

              // Mettre à jour le statut à "pending" une fois l'upload terminé
              console.log(
                "2️⃣ setUploadingFiles - Upload terminé, statut pending",
              );
              setUploadingFiles((prev) =>
                prev.map((f) =>
                  f.id === fileId
                    ? {
                        ...f,
                        progress: 100,
                        status: "pending",
                        processingMessage: "En attente de traitement...",
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
            console.log("3️⃣ setUploadingFiles - Erreur HTTP");
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
          console.log("4️⃣ setUploadingFiles - Erreur réseau");
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

    let projectId = project?.id;

    if (!project?.id) {
      console.log("Création d'un nouveau projet");
      const newProject = await createProject();
      projectId = newProject?.id;
      if (!newProject) {
        console.error("Erreur lors de la création du projet");
        setIsUploading(false);
        return;
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
          status: "pending",
        }),
      );

      setUploadingFiles(uploadingFilesArray);
      setSelectedFiles([]);

      const uploadPromises = uploadingFilesArray.map(async (uploadingFile) => {
        console.log("uploadingFile:", uploadingFile);
        try {
          // Obtenir l'URL présignée
          if (!uploadingFile.file) {
            throw new Error("Fichier manquant");
          }

          console.log("projectId:", projectId);

          const presignedUrl = await getPresignedUrl(
            uploadingFile.file,
            projectId,
          );

          console.log("presignedUrl:", presignedUrl);

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

          console.log("uploadSuccess:", uploadSuccess);

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
          console.log("7️⃣ setUploadingFiles - Erreur lors de l'upload");
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

      console.log("results:", results);

      const successfulUploads = results.filter(Boolean) as {
        fileName: string;
        fileId: string;
      }[];

      if (successfulUploads.length > 0) {
        console.log("successfulUploads:", successfulUploads);
        console.log("Start confirmation of multiple uploads");
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
      console.log(`Document trouvé pour ${fileName}:`, data);
      return data.id || null;
    } catch (error) {
      console.error(
        `Erreur lors de la recherche du document ${fileName}:`,
        error,
      );
      return null;
    }
  };

  // Modifier la fonction confirmMultipleUploadsToBackend
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

      fetch("/api/documents/confirm-multiple-uploads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // Mettre à jour le statut des fichiers
      setUploadingFiles((prev) =>
        prev.map((f) => {
          const matchingFile = f.file && fileNames.includes(f.file.name);
          if (matchingFile) {
            return {
              ...f,
              status: "indexing" as const,
            };
          }
          return f;
        }),
      );

      // Récupérer l'id pour chaque document via l'api externe
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

          monitorDocumentProcessing(documentId, projectId, setUploadingFiles);
        }

        return { fileName, documentId };
      });

      // Attendre que toutes les requêtes soient terminées
      await Promise.all(documentPromises);
    } catch (error) {
      console.error("Erreur lors de la confirmation des uploads:", error);
      return null;
    }
  };

  const handleToolClick = (toolId: string) => {
    console.log(`Outil sélectionné: ${toolId}`);
    // Ici, vous pourriez naviguer vers une page spécifique à l'outil
    // ou ouvrir une modale, etc.
  };

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      <div className="banner h-[50vh] w-full relative flex-shrink-0">
        <Image
          src="/assets/img/bg.jpg"
          alt="Bannière d'arrière-plan"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="mt-[-35vh] pb-[80vh] inset-0 m-auto w-full px-40">
        <div className="flex flex-col w-full rounded-[30px] relative p-4 gap-4 bg-white">
          <div className="rounded-[20px] p-6 bg-black/5">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
              {project
                ? project.name || "Nouveau projet"
                : "BTP Consultants IA"}
            </h1>
            <h2 className="text-xl md:text-2xl font-medium text-center">
              {project
                ? project.date
                  ? `Projet créé le ${new Date(project.date).toLocaleDateString(
                      "fr-FR",
                    )}`
                  : "Projet en cours de création..."
                : "Votre boîte à outils pour le Contrôle Technique"}
            </h2>
          </div>

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

            {uploadingFiles.length > 0 && (
              <FileUploadList files={uploadingFiles} projectId={project?.id} />
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
                      className={`rounded-lg p-4 cursor-pointer min-h-[25vh] transition-all hover:shadow-md ${tool.color} border border-transparent hover:border-current`}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full p-2 bg-white/80">
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{tool.name}</h4>
                          <p className="text-sm opacity-80 mt-1 line-clamp-3">
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
    </div>
  );
}

const monitorDocumentProcessing = async (
  documentId: string,
  projectId: string,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
) => {
  try {
    console.log("🔟 setUploadingFiles - Début du monitoring");
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.id === documentId
          ? {
              ...f,
              documentId,
              status: "indexing" as const,
            }
          : f,
      ),
    );

    let isProcessingComplete = false;

    while (!isProcessingComplete) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const response = await fetch("/api/documents/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId, projectId }),
      });

      if (!response.ok) {
        console.error("Erreur lors de la surveillance du document");
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
        PENDING: "pending" as const,
      };

      const mappedStatus =
        statusMap[data.status as keyof typeof statusMap] ||
        ("pending" as const);

      console.log(
        "1️⃣1️⃣ setUploadingFiles - Mise à jour du statut pendant le monitoring",
      );
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === documentId
            ? {
                ...f,
                status: mappedStatus,
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
    console.log("1️⃣2️⃣ setUploadingFiles - Erreur pendant le monitoring");
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.id === documentId
          ? {
              ...f,
              status: "error" as const,
            }
          : f,
      ),
    );
  }
};
