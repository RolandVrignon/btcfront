import {
  PublicDocumentList,
  UploadingFile,
  DocumentStatus,
  Project,
} from "@/src/types/project";

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
    console.error("Erreur lors de la création du projet:", error);
    return null;
  }
};

export const searchPublicDocuments = async (
  city: string,
): Promise<PublicDocumentList> => {
  const response = await fetch(
    `/api/tools/search-public-documents?city=${city}`,
  );
  const data = await response.json();
  return data;
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
    const timeoutDuration = 10 * 60 * 1000;

    while (
      !isProcessingComplete &&
      projectRef.current?.externalId === projectId
    ) {
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
                  status: "ERROR" as DocumentStatus,
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

      const terminalStatuses = ["COMPLETED", "ERROR"];

      if (terminalStatuses.includes(data.status)) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === documentId
              ? {
                  ...f,
                  status: data.status as DocumentStatus,
                  tags: Array.isArray(data.ai_Type_document)
                    ? [...data.ai_Type_document]
                    : [],
                }
              : f,
          ),
        );

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
              status: "ERROR" as DocumentStatus,
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

      while (
        !isProcessingComplete &&
        projectRef.current?.externalId === projectId
      ) {
        // Vérifier si le timeout est atteint
        if (Date.now() - startTime > timeoutDuration) {
          console.warn(
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
          console.error("Erreur lors de la récupération du statut du projet");
          continue;
        }

        const projectData = await response.json();

        // Vérifier si le traitement est terminé
        if (
          projectData.status === "COMPLETED" ||
          projectData.status === "ERROR"
        ) {
          isProcessingComplete = true;
          setProject(projectData);
          const publicDocuments = await searchPublicDocuments(
            projectData.ai_city,
          );
          projectData.documents = publicDocuments as PublicDocumentList;
          resolve(projectData);
          setProject(projectData);
          return;
        }
      }
    } catch (error) {
      console.error("Erreur lors du monitoring du projet:", error);
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
    console.error(
      `Erreur lors de la recherche du document ${fileName}:`,
      error,
    );
    return null;
  }
};

export const uploadFileToS3 = async (
  file: File,
  presignedUrl: string,
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
                      status: "PROGRESS" as DocumentStatus,
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
                    status: "ERROR" as DocumentStatus,
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
                  status: "ERROR" as DocumentStatus,
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
      console.error("Erreur lors de la récupération du projet");
      return null;
    }

    const data = await res.json();

    setProject(data);
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return null;
  }
};

export const confirmMultipleUploadsToBackend = async (
  projectRef: React.MutableRefObject<Project | null>,
  projectId: string | undefined,
  fileNames: string[],
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
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

    // Mettre à jour le statut des fichiers
    setUploadingFiles((prev) =>
      prev.map((f) => {
        const matchingFile = f.file && fileNames.includes(f.file.name);
        if (matchingFile) {
          return {
            ...f,
            status: "PROGRESS" as DocumentStatus,
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

      if (documentId) {
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
          projectRef,
          documentId,
          projectId,
          setUploadingFiles,
        );
      }

      return { fileName, documentId };
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
          console.error("Erreur lors de la récupération du projet");
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
            console.error("Erreur lors du monitoring du projet:", error);
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

export const uploadAllFilesUtils = async (
  projectRef: React.MutableRefObject<Project | null>,
  selectedFiles: File[],
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>,
  setProject: React.Dispatch<React.SetStateAction<Project | null>>,
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  project: Project | null,
  getPresignedUrl: (
    file: File,
    projectId?: string,
  ) => Promise<{ url: string; expiresIn: number; key: string } | null>,
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>,
) => {
  setIsUploading(true);

  if (selectedFiles.length === 0) {
    console.error("Aucun fichier sélectionné");
    setIsUploading(false);
    return;
  }

  let projectId = project?.externalId;

  if (!project) {
    const newProject = await createProject(setProject, setProjects);
    projectId = newProject?.externalId;

    if (!newProject) {
      console.error("Erreur lors de la création du projet");
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
      status: "UPLOAD" as DocumentStatus,
    }));

    setUploadingFiles((prev) => [...uploadingFilesArray, ...prev]);

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
                  status: "UPLOAD" as DocumentStatus,
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
          setUploadingFiles,
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
                  status: "ERROR" as DocumentStatus,
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
        projectRef,
        projectId,
        successfulUploads.map((u) => u.fileName),
        setUploadingFiles,
        setProject,
        setIsUploading,
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'upload des fichiers:", error);
  }
};
