import {
  PublicDocumentList,
  UploadingFile,
  Status,
  Project,
  DeliverableType,
  PublicData,
} from "@/src/types/type";
import { logger } from "@/src/utils/logger";

export const createProject = async (
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
) => {
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

    await handleProjectUpdate(obj.id, setProject);

    setProjects((prev: Project[]) => [obj, ...prev]);

    return obj;
  } catch (error) {
    logger.error("Erreur lors de la création du projet:", error);
    return null;
  }
};

export const searchPublicDocuments = async (
  projectId: string,
): Promise<PublicDocumentList> => {
  try {
    if (!projectId) {
      logger.error("ID du projet manquant");
      return [];
    }

    // Création initiale du livrable
    const initialResponse = await fetch(`/api/deliverables`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        type: DeliverableType.DOCUMENTS_PUBLIQUES,
        user_prompt: "",
        new: true,
        documentIds: [],
      }),
    });

    console.log("searchPublicDocuments initialResponse", initialResponse);

    if (!initialResponse.ok) {
      throw new Error("Échec de la création du livrable");
    }

    const deliverable = await initialResponse.json();

    // Si le livrable est déjà prêt, retournez les résultats
    if (deliverable.status === "COMPLETED") {
      return deliverable.short_result as PublicDocumentList;
    }

    if (deliverable.status === "ERROR") {
      logger.error("Erreur lors de la génération du livrable");
      return [];
    }

    // Polling pour attendre que le livrable soit prêt
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      const pollResponse = await fetch(`/api/deliverables/${deliverable.id}`);

      if (!pollResponse.ok) {
        throw new Error("Échec de la récupération du statut du livrable");
      }

      const updatedDeliverable = await pollResponse.json();

      if (updatedDeliverable.status === "COMPLETED") {
        logger.info(
          "searchPublicDocuments updatedDeliverable",
          updatedDeliverable,
        );
        return updatedDeliverable.short_result as PublicDocumentList;
      }

      if (updatedDeliverable.status === "ERROR") {
        logger.error("Erreur lors de la génération du livrable");
        return [];
      }

      logger.info(
        "searchPublicDocuments updatedDeliverable",
        updatedDeliverable,
      );
    }

    logger.error("Délai d'attente dépassé pour la génération du livrable");
    return [];
  } catch (error) {
    logger.error("Erreur lors de la recherche de documents publics:", error);
    return [];
  }
};

export const searchPublicData = async (
  projectId: string,
): Promise<PublicData | undefined> => {
  try {
    if (!projectId) {
      logger.error("ID du projet manquant");
      return undefined;
    }

    // Création initiale du livrable
    const initialResponse = await fetch(`/api/deliverables`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectId,
        type: DeliverableType.GEORISQUES,
        user_prompt: "",
        new: true,
        documentIds: [],
      }),
    });

    console.log("searchPublicData initialResponse", initialResponse);

    if (!initialResponse.ok) {
      throw new Error("Échec de la création du livrable géorisques");
    }

    const deliverable = await initialResponse.json();

    // Si le livrable est déjà prêt, retournez les résultats
    if (deliverable.status === "COMPLETED") {
      return deliverable.short_result as PublicData;
    }

    if (deliverable.status === "ERROR") {
      logger.error("Erreur lors de la génération des données géorisques");
      return undefined;
    }

    // Polling pour attendre que le livrable soit prêt
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      const pollResponse = await fetch(`/api/deliverables/${deliverable.id}`);

      if (!pollResponse.ok) {
        throw new Error(
          "Échec de la récupération du statut du livrable géorisques",
        );
      }

      const updatedDeliverable = await pollResponse.json();

      if (updatedDeliverable.status === "COMPLETED") {
        return updatedDeliverable.short_result as PublicData;
      }

      if (updatedDeliverable.status === "ERROR") {
        logger.error("Erreur lors de la génération des données géorisques");
        return undefined;
      }
    }

    logger.error(
      "Délai d'attente dépassé pour la génération des données géorisques",
    );

    return undefined;
  } catch (error) {
    logger.error("Erreur lors de la recherche des données géorisques:", error);
    return undefined;
  }
};

export const monitorDocumentProcessing = async (
  projectRef: React.MutableRefObject<Project | null>,
  documentId: string,
  projectId: string,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
) => {
  try {
    let isProcessingComplete = false;
    const startTime = Date.now();
    const timeoutDuration = 30 * 60 * 1000;

    while (
      !isProcessingComplete &&
      projectRef.current?.externalId === projectId
    ) {
      // Vérifier si le timeout est atteint
      if (Date.now() - startTime > timeoutDuration) {
        logger.warn(
          `Timeout atteint pour le document ${documentId} après 10 minutes`,
        );
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === documentId
              ? {
                  ...f,
                  status: "ERROR" as Status,
                  indexation_status: "ERROR" as Status,
                  processingMessage: "Timeout après 10 minutes de traitement",
                }
              : f,
          ),
        );
        return; // Sortir de la fonction
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

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

      const terminalStatuses = ["COMPLETED", "ERROR"];

      // Vérifier que les deux statuts ont atteint un état terminal
      const isStatusTerminal = terminalStatuses.includes(data.status);
      const isIndexationStatusTerminal = terminalStatuses.includes(
        data.indexation_status,
      );

      setUploadingFiles((prev) =>
        prev.map((f) =>
          f.id === documentId
            ? {
                ...f,
                status: data.status as Status,
                indexation_status: data.indexation_status as Status,
                tags: Array.isArray(data.ai_Type_document)
                  ? [...data.ai_Type_document]
                  : [],
              }
            : f,
        ),
      );

      // Le traitement est complet uniquement si les deux statuts sont terminaux
      if (isStatusTerminal && isIndexationStatusTerminal) {
        isProcessingComplete = true;
      }
    }
  } catch (error) {
    logger.error("Erreur lors du monitoring du document:", error);
    setUploadingFiles((prev) =>
      prev.map((f) =>
        f.id === documentId
          ? {
              ...f,
              processingMessage: "Erreur lors du monitoring du document",
            }
          : f,
      ),
    );
  }
};

export const monitorProjectStatus = async (
  projectRef: React.MutableRefObject<Project | null>,
  projectId: string,
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
): Promise<Project | null> => {
  return new Promise(async (resolve, reject) => {
    try {
      let isProcessingComplete = false;
      const startTime = Date.now();
      const timeoutDuration = 10 * 60 * 1000; // 10 minutes en millisecondes
      let projectData: Project | null = null;

      while (
        !isProcessingComplete &&
        projectRef.current?.externalId === projectId
      ) {
        // Vérifier si le timeout est atteint
        if (Date.now() - startTime > timeoutDuration) {
          logger.warn(
            `Timeout atteint pour le projet ${projectId} après 10 minutes`,
          );
          reject(
            new Error("Timeout: Le monitoring du projet a dépassé 10 minutes"),
          );
          return;
        }

        // Attendre un peu entre chaque requête
        await new Promise((timeoutResolve) => setTimeout(timeoutResolve, 2000));

        // Récupérer le statut du projet
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          logger.error("Erreur lors de la récupération du statut du projet");
          continue;
        }

        projectData = await response.json();

        if (
          projectData?.status === "COMPLETED" ||
          projectData?.status === "ERROR"
        ) {
          isProcessingComplete = true;
          setProject(projectData);
          break;
        }
      }

      if (
        projectData?.latitude &&
        projectData?.longitude &&
        projectData?.closest_formatted_address
      ) {
        logger.info("Recherche de documents publics et données géorisques");
        logger.info("Adresse proche:", projectData?.closest_formatted_address);
        logger.info(
          "Latitude et longitude:",
          projectData?.latitude,
          ", ",
          projectData?.longitude,
        );

        // Run both searches in parallel
        const [publicDocuments, publicData] = await Promise.all([
          searchPublicDocuments(projectId),
          searchPublicData(projectId),
        ]);

        logger.info("publicDocuments", publicDocuments);
        logger.info("publicData", publicData);

        projectData.documents = publicDocuments as PublicDocumentList;
        projectData.publicData = publicData;
      }
      resolve(projectData);
      setProject(projectData);
      return;
    } catch (error) {
      logger.error("Erreur lors du monitoring du projet:", error);
      reject(error);
    }
  });
};

export const getDocumentIdByFileName = async (
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
    logger.error(`Erreur lors de la recherche du document ${fileName}:`, error);
    return null;
  }
};

export const uploadFileToS3 = async (
  file: File,
  uploadUrl: string,
  fileId: string,
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
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
      formData.append("uploadUrl", uploadUrl);
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
                      status: "PENDING" as Status,
                      indexation_status: "PENDING" as Status,
                    }
                  : f,
              ),
            );

            resolve(true);
          } catch (error) {
            logger.error("Erreur lors du parsing de la réponse:", error);
            reject(new Error("Erreur lors du parsing de la réponse"));
          }
        } else {
          logger.error("Erreur lors de l'upload:", xhr.statusText);

          try {
            const errorData = JSON.parse(xhr.responseText);
            logger.error("Détails de l'erreur:", errorData);
          } catch (e) {
            logger.error("Erreur lors du parsing de la réponse:", e);
          }

          // Mettre à jour le statut en cas d'erreur
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.id === fileId
                ? {
                    ...f,
                    status: "ERROR" as Status,
                    indexation_status: "ERROR" as Status,
                    processingMessage: `Erreur HTTP: ${xhr.status}`,
                  }
                : f,
            ),
          );

          reject(new Error(`Erreur HTTP: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        logger.error("Erreur réseau lors de l'upload");

        // Mettre à jour le statut en cas d'erreur réseau
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "ERROR" as Status,
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
    logger.error("Erreur lors de l'upload du fichier vers S3:", error);
    return false;
  }
};

export const handleProjectUpdate = async (
  projectId: string,
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
) => {
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      logger.error("Erreur lors de la récupération du projet");
      return null;
    }

    const data = await res.json();

    setProject(data);
    return data;
  } catch (error) {
    logger.error("Erreur lors de la récupération du projet:", error);
    return null;
  }
};

export const confirmMultipleUploadsToBackend = async (
  projectRef: React.MutableRefObject<Project | null>,
  projectId: string | undefined,
  successfulUploads: {
    fileName: string;
    fileId: string;
    downloadUrl: string | null;
  }[],
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  if (!projectId) {
    logger.error("ID du projet manquant");
    return null;
  }

  try {
    const body = {
      projectId,
      downloadUrls: successfulUploads.map((u) => u.downloadUrl),
    };

    // Mettre à jour le statut des fichiers
    setUploadingFiles((prev) =>
      prev.map((f) => {
        const matchingFile =
          f.file && successfulUploads.some((u) => u.fileName === f.fileName);
        if (matchingFile) {
          return {
            ...f,
            status: "PENDING" as Status,
            indexation_status: "PENDING" as Status,
          };
        }
        return f;
      }),
    );

    // Créer les promesses pour le traitement des documents
    const documentPromises = successfulUploads.map(async (upload) => {
      let documentId: string | null = null;
      while (!documentId) {
        documentId = await getDocumentIdByFileName(projectId, upload.fileName);
        if (!documentId) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (documentId) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.file && f.file.name === upload.fileName
              ? {
                  ...f,
                  id: documentId,
                }
              : f,
          ),
        );

        await monitorDocumentProcessing(
          projectRef,
          documentId,
          projectId,
          setUploadingFiles,
        );
      }

      return { fileName: upload.fileName, documentId };
    });

    // Fonction pour gérer tout le processus lié au projet
    const projectPromise = async () => {
      try {
        // Vérifier si c'est le premier upload en récupérant l'état actuel du projet
        const projectResponse = await fetch(`/api/projects/${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!projectResponse) {
          logger.error("Erreur lors de la récupération du projet");
          return null;
        }

        const currentProject = await projectResponse.json();
        const isFirstUpload =
          !currentProject?.short_summary || currentProject.short_summary === "";

        // Si c'est le premier upload, démarrer le monitoring du projet
        if (isFirstUpload) {
          try {
            // Monitorer le projet jusqu'à ce qu'il soit terminé
            const finalProject = await monitorProjectStatus(
              projectRef,
              projectId,
              setProject,
            );
            return finalProject;
          } catch (error) {
            logger.error("Erreur lors du monitoring du projet:", error);
            // En cas d'erreur, essayer de récupérer l'état actuel du projet
            return await handleProjectUpdate(projectId, setProject);
          }
        } else {
          // Si ce n'est pas le premier upload, simplement mettre à jour l'état du projet
          const updatedProject = await handleProjectUpdate(
            projectId,
            setProject,
          );
          setIsUploading(false);
          return updatedProject;
        }
      } catch (error) {
        logger.error("Erreur dans le processus de projet:", error);
        setIsUploading(false);
        return null;
      }
    };

    // Attendre que les deux processus soient terminés en parallèle
    Promise.all([Promise.all(documentPromises), projectPromise()]);

    // Confirmer les uploads à l'API

    logger.debug("body:", body);

    await fetch("/api/documents/confirm-multiple-uploads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    logger.error("Erreur lors de la confirmation des uploads:", error);
    setIsUploading(false);
    return null;
  }
};

export const uploadAllFilesUtils = async (
  projectRef: React.MutableRefObject<Project | null>,
  selectedFiles: File[],
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  project: Project | null,
  getUploadUrl: (
    file: File,
    projectId?: string,
  ) => Promise<{ url: string; expiresIn: number; key: string } | null>,
  getDownloadUrl: (
    projectId?: string,
    fileName?: string,
  ) => Promise<{ url: string } | null>,
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>,
) => {
  setIsUploading(true);

  if (selectedFiles.length === 0) {
    logger.error("Aucun fichier sélectionné");
    setIsUploading(false);
    return;
  }

  let projectId = project?.externalId;

  if (!project) {
    const newProject = await createProject(setProject, setProjects);
    projectId = newProject?.externalId;

    if (!newProject) {
      logger.error("Erreur lors de la création du projet");
      setIsUploading(false);
      return;
    }
  }

  try {
    // Créer un tableau pour suivre les uploads
    const uploadingFilesArray: UploadingFile[] = selectedFiles.map((file) => ({
      file,
      id: file.name,
      fileName: file.name,
      progress: 0,
      status: "UPLOAD" as Status,
    }));

    setUploadingFiles((prev) => [...uploadingFilesArray, ...prev]);

    setSelectedFiles([]);

    const uploadPromises = uploadingFilesArray.map(async (uploadingFile) => {
      try {
        // Obtenir l'URL présignée
        if (!uploadingFile.file) {
          throw new Error("Fichier manquant");
        }

        const uploadUrl = await getUploadUrl(uploadingFile.file, projectId);

        if (!uploadUrl) {
          throw new Error("Impossible d'obtenir l'URL présignée");
        }

        logger.debug("uploadUrl:", uploadUrl);

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: "UPLOAD" as Status,
                  progress: 0,
                  processingMessage: "Démarrage de l'upload...",
                }
              : f,
          ),
        );

        // Uploader le fichier avec suivi de progression
        const uploadSuccess = await uploadFileToS3(
          uploadingFile.file,
          uploadUrl.url,
          uploadingFile.id,
          setUploadingFiles,
        );

        if (!uploadSuccess) {
          throw new Error("Échec de l'upload");
        }

        logger.debug("uploadingFile:", uploadingFile);

        logger.debug("On va tenter de récupérer l'url de download !!!!");
        logger.debug("projectId:", projectId);
        logger.debug("uploadingFile.file.name:", uploadingFile.file.name);

        if (!projectId) {
          throw new Error("ID du projet manquant");
        }

        const downloadUrl = await getDownloadUrl(
          projectId,
          uploadingFile.file.name,
        );

        logger.debug("downloadUrl:", downloadUrl);

        return {
          fileName: uploadingFile.file.name,
          fileId: uploadingFile.id,
          downloadUrl: downloadUrl,
        };
      } catch (error) {
        logger.error(
          `Erreur lors de l'upload du fichier ${uploadingFile}:`,
          error,
        );

        // Mettre à jour le statut en cas d'erreur
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? {
                  ...f,
                  status: "ERROR" as Status,
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
      downloadUrl: string | null;
    }[];

    logger.debug("successfulUploads:", successfulUploads);

    if (successfulUploads.length > 0) {
      await confirmMultipleUploadsToBackend(
        projectRef,
        projectId,
        successfulUploads,
        setUploadingFiles,
        setProject,
        setIsUploading,
      );
    }
  } catch (error) {
    logger.error("Erreur lors de l'upload des fichiers:", error);
  }
};
