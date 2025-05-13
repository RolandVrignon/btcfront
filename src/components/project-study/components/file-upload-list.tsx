"use client";

import { useState, useEffect, useRef } from "react";
import {
  File,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  ExternalLink,
  Clock,
  Trash,
} from "lucide-react";
import { DocumentMetadataDialog } from "@/src/components/project-study/dialogs/document-metadata-dialog";
import { UploadingFile } from "@/src/types/type";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { LoadingSpinner } from "@/src/components/ui/loading-spinner";
import { StatusPastille } from "../../ui/status-pastille";
import { logger } from "@/src/utils/logger";

interface FileUploadListProps {
  files: UploadingFile[];
  projectId?: string;
  isLoading?: boolean;
  setUploadingFiles: (files: UploadingFile[]) => void;
}

export function FileUploadList({
  files,
  projectId,
  isLoading,
  setUploadingFiles,
}: FileUploadListProps) {
  const [selectedFile, setSelectedFile] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Générer une clé stable pour le localStorage
  const timerStorageKey = `timer_end_${projectId || "default"}`;

  // Fonction pour calculer le temps initial en secondes
  const calculateInitialTime = () => {
    const docsInProgress = files.filter(
      (file) => file.status !== "COMPLETED" && file.status !== "ERROR",
    ).length;

    if (docsInProgress === 0) return null;

    // Calcul en secondes: Math.ceil(docsInProgress / 15) * 2 minutes
    return Math.ceil(docsInProgress / 15) * 2 * 60;
  };

  // Fonction pour démarrer ou redémarrer le timer
  const startTimer = (durationInSeconds: number) => {
    // Arrêter tout timer existant
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Vérifier s'il y a déjà un timer en cours dans le localStorage
    let endTime = null;
    const savedEndTime = localStorage.getItem(timerStorageKey);

    if (savedEndTime) {
      const parsedEndTime = parseInt(savedEndTime, 10);
      const now = Date.now();

      // Si le temps de fin est encore dans le futur, l'utiliser
      if (parsedEndTime > now) {
        endTime = parsedEndTime;
      }
    }

    // Si aucun timer en cours ou s'il est expiré, en créer un nouveau
    if (!endTime) {
      endTime = Date.now() + durationInSeconds * 1000;
      localStorage.setItem(timerStorageKey, endTime.toString());
    }

    endTimeRef.current = endTime;

    // Calculer et définir le temps restant initial
    const initialRemainingSeconds = Math.max(
      0,
      Math.ceil((endTime - Date.now()) / 1000),
    );
    setRemainingSeconds(initialRemainingSeconds);

    // Démarrer le nouvel intervalle
    timerIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const end = endTimeRef.current;

      if (!end) {
        clearInterval(timerIntervalRef.current!);
        timerIntervalRef.current = null;
        return;
      }

      // Calculer le temps restant
      const remaining = Math.max(0, Math.ceil((end - now) / 1000));
      setRemainingSeconds(remaining);

      // Arrêter le timer quand il atteint zéro
      if (remaining === 0) {
        clearInterval(timerIntervalRef.current!);
        timerIntervalRef.current = null;
        localStorage.removeItem(timerStorageKey);
      }
    }, 1000);
  };

  // Initialiser le timer au montage du composant en vérifiant d'abord le localStorage
  useEffect(() => {
    const savedEndTime = localStorage.getItem(timerStorageKey);

    if (savedEndTime) {
      const parsedEndTime = parseInt(savedEndTime, 10);
      const now = Date.now();

      // Si le temps de fin est encore dans le futur, reprendre le timer
      if (parsedEndTime > now) {
        endTimeRef.current = parsedEndTime;
        const remaining = Math.max(0, Math.ceil((parsedEndTime - now) / 1000));
        setRemainingSeconds(remaining);

        // Démarrer l'intervalle
        timerIntervalRef.current = setInterval(() => {
          const currentNow = Date.now();
          const end = endTimeRef.current;

          if (!end) {
            clearInterval(timerIntervalRef.current!);
            timerIntervalRef.current = null;
            return;
          }

          const remaining = Math.max(0, Math.ceil((end - currentNow) / 1000));
          setRemainingSeconds(remaining);

          if (remaining === 0) {
            clearInterval(timerIntervalRef.current!);
            timerIntervalRef.current = null;
            localStorage.removeItem(timerStorageKey);
          }
        }, 1000);
      } else {
        // Le timer a expiré, le supprimer
        localStorage.removeItem(timerStorageKey);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
    //eslint-disable-next-line
  }, []); // Exécuter une seule fois au montage

  // Gérer les changements de fichiers
  useEffect(() => {
    // Calculer le nombre de documents en cours
    const docsInProgress = files.filter(
      (file) => file.status !== "COMPLETED" && file.status !== "ERROR",
    ).length;

    if (docsInProgress === 0) {
      // Arrêter le timer s'il n'y a plus de documents en cours
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      endTimeRef.current = null;
      setRemainingSeconds(null);
      localStorage.removeItem(timerStorageKey);
    } else {
      // Vérifier s'il y a déjà un timer en cours
      const savedEndTime = localStorage.getItem(timerStorageKey);
      const now = Date.now();

      if (!savedEndTime || parseInt(savedEndTime, 10) <= now) {
        // Aucun timer en cours ou timer expiré, en créer un nouveau
        const initialDuration = calculateInitialTime();
        if (initialDuration) {
          startTimer(initialDuration);
        }
      }
    }
    //eslint-disable-next-line
  }, [files]);

  // Formater le temps restant en MM:SS
  const formatRemainingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".pdf")) {
      return <File className="h-5 w-5 text-red-500" />;
    } else if (fileName.endsWith(".csv")) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
    } else if (
      fileName.toLowerCase().endsWith(".docx") ||
      fileName.toLowerCase().endsWith(".doc") ||
      fileName.toLowerCase().endsWith(".xls") ||
      fileName.toLowerCase().endsWith(".xlsx")
    ) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    } else if (
      fileName.toLowerCase().endsWith(".jpg") ||
      fileName.toLowerCase().endsWith(".jpeg") ||
      fileName.toLowerCase().endsWith(".png")
    ) {
      return <ImageIcon className="h-5 w-5 text-purple-500" />;
    }
    return <File className="h-5 w-5 text-blue-500" />;
  };

  // Fonction pour ouvrir la popup de métadonnées
  const handleFileClick = (documentId: string) => {
    const uploadingFile = files.find((f) => f.id === documentId);
    if (!uploadingFile || !projectId) {
      logger.warn("Tentative d'ouverture d'un fichier sans ID de projet");
      return;
    }

    logger.debug(
      "Ouverture des métadonnées du fichier:",
      uploadingFile.fileName,
    );
    setSelectedFile({
      id: documentId,
      name: uploadingFile.fileName ?? "",
    });
    setIsDialogOpen(true);
  };

  // Fonction pour obtenir l'URL de visualisation et ouvrir le fichier
  const openFileInNewTab = async (page: number = 0) => {
    if (!selectedFile || !projectId) {
      logger.warn(
        "Tentative d'ouverture d'un fichier sans sélection ou ID de projet",
      );
      return;
    }

    try {
      logger.debug(
        "Récupération de l'URL de visualisation pour:",
        selectedFile.name,
      );
      // Appel à notre API interne pour obtenir l'URL de visualisation
      const response = await fetch("/api/documents/view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          projectId: projectId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération de l'URL de visualisation",
        );
      }

      const data = await response.json();

      if (data.url) {
        logger.debug("URL de visualisation obtenue avec succès");
        // Ajouter le numéro de page à l'URL si une page est spécifiée
        const urlWithPage = page > 0 ? `${data.url}#page=${page}` : data.url;
        window.open(urlWithPage, "_blank");
      } else {
        throw new Error("URL de visualisation non disponible");
      }
    } catch (error) {
      logger.error("Erreur lors de l'ouverture du fichier:", error);
      alert("Impossible d'ouvrir le fichier. Veuillez réessayer plus tard.");
    }
  };

  // Ajouter la fonction de suppression locale
  const handleDeleteFile = (fileName: string) => {
    logger.info("Suppression du fichier avec l'id:", fileName);

    setUploadingFiles(files.filter((file) => file.fileName !== fileName));
  };

  return (
    <>
      <div className="mt-4 w-full">
        <div className="flex w-full justify-between items-center">
          <h3 className="text-xl font-semibold mb-4">
            Fichiers ({isLoading ? "..." : files.length})
          </h3>
          {remainingSeconds !== null && remainingSeconds > 0 && (
            <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-light flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Temps restant estimé : {formatRemainingTime(remainingSeconds)}
            </div>
          )}
        </div>
        <ScrollArea className="border rounded-lg flex flex-col max-h-[30vh] overflow-y-auto">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="p-2 border-b animate-pulse"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-shrink-0 max-w-[80%] items-center gap-2">
                      <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                      <div className="h-6 w-52 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              ))
            : files.map((file) => (
                <div
                  key={file.id}
                  className="p-2 border-b hover:bg-gray-100 cursor-pointer transition-colors group"
                  onClick={() => handleFileClick(file.id)}
                >
                  <div className="grid grid-cols-10 items-center w-full">
                    <div className="col-span-6 flex items-center overflow-hidden">
                      <div className="text-muted-foreground flex-shrink-0 mr-2">
                        {getFileIcon(file.fileName ?? "")}
                      </div>
                      <div className="truncate min-w-0">
                        <p className="font-medium truncate">{file.fileName}</p>
                      </div>
                    </div>
                    <div className="col-span-4 flex gap-2 items-center justify-end">
                      {file.tags &&
                        file.tags.length > 0 &&
                        file.tags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap"
                          >
                            {tag}
                          </div>
                        ))}

                      {file.status === "UPLOAD" ? (
                        <div className="flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full whitespace-nowrap">
                          <LoadingSpinner />
                          Upload
                        </div>
                      ) : file.status === "PENDING" ? (
                        <div className="flex items-center text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full whitespace-nowrap">
                          Extraction en attente
                        </div>
                      ) : file.status === "PROGRESS" ? (
                        <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full whitespace-nowrap">
                          <LoadingSpinner />
                          Extraction des métadonnées
                        </div>
                      ) : file.status === "COMPLETED" ? (
                        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center whitespace-nowrap">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Voir plus
                        </div>
                      ) : file.status === "ERROR" ? (
                        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full whitespace-nowrap">
                          Erreur
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                          {file.status}
                        </div>
                      )}
                      {file.indexation_status === "PENDING" ? (
                        <StatusPastille status="pending" />
                      ) : file.indexation_status === "PROGRESS" ? (
                        <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full whitespace-nowrap">
                          <LoadingSpinner />
                          Indexation
                        </div>
                      ) : file.indexation_status === "COMPLETED" ? (
                        <StatusPastille status="completed" />
                      ) : file.indexation_status === "ERROR" ? (
                        <StatusPastille status="error" />
                      ) : (
                        <StatusPastille status="pending" />
                      )}
                      {(file.status === "ERROR" ||
                        file.indexation_status === "ERROR") && (
                        <button
                          type="button"
                          className="ml-2 text-red-500 hover:text-red-700"
                          title="Supprimer le fichier"
                          onClick={(e) => {
                            e.stopPropagation(); // Empêche l'ouverture du dialog
                            handleDeleteFile(file.fileName ?? "");
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barre de progression pour l'upload */}
                  {file.status === "UPLOAD" && (
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              ))}
        </ScrollArea>
      </div>

      {selectedFile && projectId && (
        <DocumentMetadataDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          fileName={selectedFile.name}
          projectId={projectId}
          onOpenDocument={openFileInNewTab}
          fileStatus={files.find((f) => f.id === selectedFile.id)?.status}
        />
      )}
    </>
  );
}
