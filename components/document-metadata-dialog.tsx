"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentMetadataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  projectId: string;
  onOpenDocument: () => void;
  fileStatus?: string;
}

interface MetadataItem {
  key: string;
  value: string | number | boolean | null | object | any[];
}

type Metadata = MetadataItem[] | Record<string, any>;

export function DocumentMetadataDialog({
  isOpen,
  onClose,
  fileName,
  projectId,
  onOpenDocument,
  fileStatus,
}: DocumentMetadataDialogProps) {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isFileReady = fileStatus === "ready";

  useEffect(() => {
    if (isOpen) {
      if (isFileReady) {
        fetchMetadata();
      } else {
        // Si le fichier n'est pas prêt, on reste en état de chargement
        setIsLoading(true);
      }
    }
  }, [isOpen, fileName, projectId, isFileReady]);

  const fetchMetadata = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/documents/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName, projectId }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des métadonnées");
      }

      const data = await response.json();
      console.log("data:", data);
      setMetadata(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de récupérer les métadonnées du document");
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    }
  };

  // Fonction pour rendre une valeur de métadonnée, quelle que soit sa structure
  const renderMetadataValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        // Si c'est un tableau d'objets avec des propriétés key/value
        if (
          value.length > 0 &&
          typeof value[0] === "object" &&
          "key" in value[0] &&
          "value" in value[0]
        ) {
          return (
            <div className="space-y-2 border rounded-md p-4">
              {value.map((item, index) => (
                <div key={index} className="border-t pt-2">
                  <div className="font-medium">{item.key}</div>
                  <div className="pl-4">{renderMetadataValue(item.value)}</div>
                </div>
              ))}
            </div>
          );
        }

        // Si c'est un tableau simple
        return (
          <div className="space-y-2 border rounded-md p-2">
            {value.map((item, index) => (
              <div key={index} className="border rounded-md p-2">
                {renderMetadataValue(item)}
              </div>
            ))}
          </div>
        );
      }

      // Si c'est un objet
      return (
        <div className="space-y-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="border rounded-md p-2">
              <span className="font-medium">{key}: </span>
              {renderMetadataValue(val)}
            </div>
          ))}
        </div>
      );
    }

    // Pour les valeurs simples
    return String(value);
  };

  // Composant pour afficher un skeleton de chargement
  const MetadataSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center mb-6">
        <Skeleton className="h-5 w-5 mr-2" />
        <Skeleton className="h-6 w-64" />
      </div>

      <div className="border rounded-md p-4">
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col h-[80vh] max-w-[700px] p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl font-semibold">
            {fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {!isFileReady || isLoading ? (
            <div>
              {!isFileReady && (
                <div className="mb-6 text-amber-600 text-sm">
                  Le document est en cours de traitement. Les métadonnées seront
                  disponibles une fois le traitement terminé.
                </div>
              )}
              <MetadataSkeleton />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">
              {error}
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <div className="flex mr-2">
                  <Sparkles className="h-5 w-5" />
                </div>
                Métadonnées du document
              </h3>
              <div className="rounded-md">
                {Array.isArray(metadata) ? (
                  <div className="divide-y">
                    {metadata.map((item, index) => (
                      <div key={index} className="flex flex-col gap-2 p-3">
                        <div className="font-semibold text-primary">
                          {item.key}
                        </div>
                        <div className="mt-1">
                          {renderMetadataValue(item.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border rounded-2xl">
                    {metadata &&
                      Object.entries(metadata).map(([key, value]) => (
                        <div key={key} className={`flex flex-col p-3 ${Object.keys(metadata).pop() !== key ? 'border-b' : ''}`}>
                          <div className="font-medium">{key}</div>
                          <div className="text-gray-500">
                            {renderMetadataValue(value)}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={onOpenDocument} disabled={isLoading && isFileReady}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ouvrir le fichier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
