"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { FileUploadZone } from "@/components/file-upload-zone";
import { FileUploadList } from "@/components/file-upload-list";
import { Project } from "@/types/project";
import { usePresignedUrl } from "@/lib/hooks/use-presigned-url";

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
}

export interface UploadingFile {
  file: File;
  id: string;
  progress: number;
  status: "processing" | "pending" | "indexing" | "rafting" | "ready" | "end" ;
  url?: string; // URL S3 où le fichier a été uploadé
  documentId?: string; // ID du document dans le backend
  processingMessage?: string; // Message associé au statut de traitement
}

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export function ProjectTools({ project: initialProject }: ProjectToolsProps) {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isClient, setIsClient] = useState(false);
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
    console.log("uploadingFiles:", uploadingFiles);
  }, [uploadingFiles]);

  // Fonction pour créer un nouveau projet
  const createProject = async (): Promise<Project | null> => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la création du projet: ${response.status}`
        );
      }

      const newProject = await response.json();
      console.log("newProject:", newProject);

      setProject(newProject);

      return newProject;
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      return null;
    }
  };

  // Fonction pour uploader un fichier vers S3 avec l'URL présignée
  const uploadFileToS3 = async (
    file: File,
    presignedUrl: string
  ): Promise<boolean> => {
    try {
      console.log("Début de l'upload vers S3 via proxy");
      console.log("Type de fichier:", file.type);
      console.log("Taille du fichier:", file.size, "bytes");

      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append("file", file);
      formData.append("presignedUrl", presignedUrl);
      formData.append("contentType", file.type);

      // Utiliser notre route API proxy pour contourner CORS
      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Erreur lors de l'upload:", result.error);
        console.error("Détails:", result.details);
        return false;
      }

      console.log("Upload réussi:", result.message);
      return true;
    } catch (error) {
      console.error("Erreur lors de l'upload du fichier vers S3:", error);
      return false;
    }
  };

  // Fonction pour surveiller le statut du document
  const monitorDocument = async (documentId: string, projectId: string) => {
    try {
      const response = await fetch("/api/documents/monitor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId, projectId }),
      });

      if (!response.ok) {
        console.error("Erreur lors de la surveillance du document");
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la surveillance du document:", error);
      return null;
    }
  };

  // Fonction pour confirmer l'upload au backend
  const confirmUploadToBackend = async (
    projectId: string,
    fileName: string
  ) => {
    try {
      const response = await fetch("/api/documents/confirm-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, fileName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erreur lors de la confirmation de l'upload:", errorData);
        return false;
      }

      const result = await response.json();
      console.log("Confirmation d'upload réussie:", result);

      // Retourner l'ID du document pour pouvoir le surveiller
      return result.id
        ? { success: true, documentId: result.id }
        : { success: true };
    } catch (error) {
      console.error("Erreur lors de la confirmation de l'upload:", error);
      return false;
    }
  };

  // Fonction pour démarrer la surveillance périodique d'un document
  const startDocumentMonitoring = (
    fileId: string,
    documentId: string,
    projectId: string
  ) => {
    const intervalId = setInterval(async () => {
      const documentStatus = await monitorDocument(documentId, projectId);

      if (!documentStatus) {
        console.error("Impossible de récupérer le statut du document");
        return;
      }

      console.log("Statut du document:", documentStatus);

      // Mettre à jour le statut du fichier
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                processingStatus: documentStatus.status,
                processingMessage: documentStatus.message,
                status:
                  documentStatus.status === "READY"
                    ? "ready"
                    : documentStatus.status === "END"
                    ? "end"
                    : documentStatus.status === "INDEXING"
                    ? "indexing"
                    : documentStatus.status === "RAFTING"
                    ? "rafting"
                    : documentStatus.status === "PROCESSING"
                    ? "processing"
                    : "processing",
              }
            : f
        )
      );

      // Si le document est prêt ou en erreur, arrêter la surveillance
      if (
        documentStatus.status === "READY" ||
        documentStatus.status === "END"
      ) {
        clearInterval(intervalId);
      }
    }, 500); // Vérifier toutes les 5 secondes

    // Stocker l'ID de l'intervalle pour pouvoir l'arrêter plus tard si nécessaire
    return intervalId;
  };

  // Fonction pour gérer le processus complet d'upload d'un fichier
  const processFileUpload = async (
    fileId: string,
    file: File,
    projectId?: string
  ) => {
    try {
      // Mettre à jour le statut du fichier à "pending"
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, progress: 10, status: "pending" } : f
        )
      );

      // 1. Obtenir l'URL présignée
      console.log("file:", file);
      console.log("projectId:", projectId);
      const presignedUrlResponse = await getPresignedUrl(file, projectId);
      console.log("presignedUrlResponse:", presignedUrlResponse);

      if (!presignedUrlResponse || !presignedUrlResponse.url) {
        throw new Error("Impossible d'obtenir l'URL présignée");
      }

      // Vérifier que l'URL contient tous les paramètres nécessaires
      const urlParams = new URL(presignedUrlResponse.url).searchParams;
      console.log("Paramètres de l'URL présignée:");
      urlParams.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });

      // Vérifier que les paramètres essentiels sont présents
      const hasAlgorithm = urlParams.has("X-Amz-Algorithm");
      const hasCredential = urlParams.has("X-Amz-Credential");
      const hasSignature = urlParams.has("X-Amz-Signature");
      const hasDate = urlParams.has("X-Amz-Date");
      const hasExpires = urlParams.has("X-Amz-Expires");

      console.log("Vérification des paramètres essentiels:");
      console.log("X-Amz-Algorithm présent:", hasAlgorithm);
      console.log("X-Amz-Credential présent:", hasCredential);
      console.log("X-Amz-Signature présent:", hasSignature);
      console.log("X-Amz-Date présent:", hasDate);
      console.log("X-Amz-Expires présent:", hasExpires);

      // Mettre à jour la progression
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 30 } : f))
      );

      // 2. Uploader le fichier vers S3
      const uploadSuccess = await uploadFileToS3(
        file,
        presignedUrlResponse.url
      );

      if (!uploadSuccess) {
        throw new Error("Échec de l'upload vers S3");
      }

      // Mettre à jour la progression
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: 80 } : f))
      );

      // 3. Confirmer l'upload au backend
      if (projectId) {
        const fileName = file.name;
        const confirmResult = await confirmUploadToBackend(projectId, fileName);
        console.log("confirmResult:", confirmResult);

        if (!confirmResult) {
          console.warn(
            "L'upload a réussi mais la confirmation au backend a échoué"
          );
          // Mettre à jour le statut du fichier à "error"
          setUploadingFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, status: "end" } : f))
          );
        } else if (confirmResult.documentId) {
          // Mettre à jour le fichier avec l'ID du document
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    progress: 100,
                    status: "pending", // Utiliser 'pending' au lieu de 'completed'
                    documentId: confirmResult.documentId,
                    processingStatus: "NOT_STARTED",
                    processingMessage:
                      "Le document est en attente de traitement",
                  }
                : f
            )
          );

          // Démarrer la surveillance du document
          startDocumentMonitoring(fileId, confirmResult.documentId, projectId);
        }
      }

      // Mettre à jour la progression et le statut
      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? {
                ...f,
                progress: 100,
                status: "ready",
                url:
                  presignedUrlResponse.key ||
                  presignedUrlResponse.url.split("?")[0],
              }
            : f
        )
      );
    } catch (error) {
      console.error(
        `Erreur lors du traitement du fichier ${file.name}:`,
        error
      );

      // Mettre à jour le statut du fichier à "error"
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "end" } : f))
      );
    }
  };

  const handleFilesSelected = async (newFiles: File[]) => {
    // Créer des objets de fichiers en téléchargement
    const filesToUpload = newFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 11),
      progress: 0,
      status: "pending" as const,
    }));

    // Ajouter les nouveaux fichiers à la liste des fichiers en téléchargement
    setUploadingFiles((prev) => [...prev, ...filesToUpload]);

    // Si aucun projet n'existe, en créer un nouveau
    let currentProject = project;

    if (!currentProject) {
      currentProject = await createProject();
    }

    console.log("currentProject:", currentProject);

    // Démarrer le téléchargement pour chaque fichier de manière asynchrone
    filesToUpload.forEach((file) => {
      processFileUpload(file.id, file.file, currentProject?.id);
    });
  };

  const handleToolClick = (toolId: string) => {
    console.log(`Outil sélectionné: ${toolId}`);
    // Ici, vous pourriez naviguer vers une page spécifique à l'outil
    // ou ouvrir une modale, etc.
  };

  // Effet pour marquer que nous sommes côté client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Si nous ne sommes pas encore côté client, retourner un placeholder
  if (!isClient) {
    return (
      <div className="flex flex-col w-full h-full overflow-auto">
        <div className="banner h-[50vh] w-full relative flex-shrink-0">
          {/* Image de fond */}
        </div>
        <div className="mt-[-35vh] pb-[80vh] inset-0 m-auto w-full px-40">
          <div className="flex flex-col w-full rounded-[30px] relative p-4 gap-4 bg-white">
            {/* Contenu de chargement */}
            <div className="rounded-[20px] p-6 bg-black/5">
              <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
                {project
                  ? project.name || "Nouveau projet"
                  : "BTP Consultants IA"}
              </h1>
            </div>
            {/* Zone de chargement */}
          </div>
        </div>
      </div>
    );
  }

  // Rendu normal une fois que nous sommes côté client
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
                      "fr-FR"
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

            {uploadingFiles.length > 0 && (
              <FileUploadList files={uploadingFiles} projectId={project?.id} />
            )}
          </div>

          {uploadingFiles.every((file) => file.status && file.status === "ready") && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-4">Outils disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${tool.color} border border-transparent hover:border-current`}
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-full p-2 bg-white/80">
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{tool.name}</h4>
                        <p className="text-sm opacity-80 mt-1">
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
