"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

interface ChatbotDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  inputValue: string;
  projectId: string | undefined;
}

export function ChatbotDialog({
  isOpen,
  setIsOpen,
  inputValue,
  projectId,
}: ChatbotDialogProps) {
  const [apiConfig, setApiConfig] = useState<{
    apiUrl: string | null;
    apiKey: string | null;
  }>({
    apiUrl: null,
    apiKey: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour récupérer les variables d'environnement du serveur
  const fetchDatas = async () => {
    try {
      const response = await fetch("/api/environment", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erreur lors de la récupération des variables d'environnement: ${response.status}`,
        );
      }

      const data = await response.json();
      return {
        apiUrl: data.NEXT_PUBLIC_CTIA_API_URL,
        apiKey: data.NEXT_PUBLIC_CTIA_API_KEY,
      };
    } catch (error) {
      console.error(
        "Échec de la récupération des variables d'environnement:",
        error,
      );
      throw error;
    }
  };

  useEffect(() => {
    const loadEnvironmentVars = async () => {
      if (!projectId) {
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchDatas();
        setApiConfig({
          apiUrl: data.apiUrl,
          apiKey: data.apiKey,
        });
      } catch (error) {
        console.error(
          "Erreur lors du chargement des variables d'environnement:",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadEnvironmentVars();
    }
  }, [isOpen, projectId]);

  const chatUrl =
    apiConfig.apiUrl && apiConfig.apiKey
      ? `${apiConfig.apiUrl}/chat/${projectId}?apiKey=${apiConfig.apiKey}&message=${inputValue}`
      : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[50vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle className="sr-only">
            Dialogue avec l&apos;assistant IA
          </DialogTitle>
          <DialogDescription className="sr-only">
            Dialogue avec l&apos;assistant IA
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden mt-4 h-full w-full rounded-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p>Chargement de l&apos;assistant...</p>
            </div>
          ) : chatUrl ? (
            <iframe
              src={chatUrl}
              className="w-full h-full border-0"
              title="Assistant IA"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>
                Impossible de charger l&apos;assistant. Veuillez vérifier la
                configuration.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
