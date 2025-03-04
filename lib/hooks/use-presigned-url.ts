import { useState } from "react";

interface PresignedUrlResponse {
  url: string;
  expiresIn: number;
  key: string;
}

interface UsePresignedUrlProps {
  onSuccess?: (response: PresignedUrlResponse, file: File) => void;
  onError?: (error: Error) => void;
}

export function usePresignedUrl({
  onSuccess,
  onError,
}: UsePresignedUrlProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getPresignedUrl = async (
    file: File,
    projectId?: string,
  ): Promise<PresignedUrlResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/storage/presignedurl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          projectId: projectId || null,
        }),
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

      const presignedUrlResponse: PresignedUrlResponse = {
        url: data.url,
        expiresIn: data.expiresIn || 3600,
        key: data.key || "",
      };

      if (onSuccess) {
        onSuccess(presignedUrlResponse, file);
      }

      return presignedUrlResponse;
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

  return {
    getPresignedUrl,
    isLoading,
    error,
  };
}
