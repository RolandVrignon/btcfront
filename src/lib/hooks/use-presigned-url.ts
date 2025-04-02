import { useState } from "react";
import { logger } from "@/src/utils/logger";

interface uploadUrlResponse {
  url: string;
  expiresIn: number;
  key: string;
}

interface downloadUrlResponse {
  url: string;
}

interface UseBucketUrlProps {
  onSuccess?: (response: uploadUrlResponse, file: File) => void;
  onError?: (error: Error) => void;
}

export function useBucketUrl({ onSuccess, onError }: UseBucketUrlProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getUploadUrl = async (
    file: File,
    projectId?: string,
  ): Promise<uploadUrlResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const body = {
        fileName: file.name,
        fileType: file.type,
        projectId: projectId || null,
      };

      logger.debug("body:", body);

      const response = await fetch("/api/storage/uploadurl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            "Erreur lors de la récupération de l'URL présignée",
        );
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("La réponse de l'API ne contient pas d'URL présignée");
      }

      const uploadUrlResponse: uploadUrlResponse = {
        url: data.url,
        expiresIn: data.expiresIn || 3600,
        key: data.key || "",
      };

      logger.info("uploadUrlResponse:", uploadUrlResponse);

      if (onSuccess) {
        onSuccess(uploadUrlResponse, file);
      }

      return uploadUrlResponse;
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("Une erreur inconnue est survenue");
      setError(error);

      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getDownloadUrl = async (
    projectId?: string,
    fileName?: string,
  ): Promise<downloadUrlResponse | null> => {
    try {
      if (!projectId || !fileName) {
        throw new Error("Project ID et fileName sont requis");
      }

      const response = await fetch("/api/storage/downloadurl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, fileName }),
      });

      logger.info("response:", response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            "Erreur lors de la récupération de l'URL de téléchargement",
        );
      }

      const data = await response.json();

      return data.url;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de l'URL de téléchargement:",
        error,
      );
      return null;
    }
  };

  return {
    getUploadUrl,
    getDownloadUrl,
    isLoading,
    error,
  };
}
