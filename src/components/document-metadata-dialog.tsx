"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  AnimatedTabs,
  AnimatedTabsContent,
} from "@/src/components/ui/animated-tabs";
import { DataTable } from "@/src/components/ui/data-table";
import type { Row } from "@tanstack/react-table";
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
  value: string | number | boolean | null | Record<string, unknown> | unknown[];
}

type Metadata = MetadataItem[] | Record<string, unknown>;

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
  const [tabIndex, setTabIndex] = useState(0);

  const isFileReady = fileStatus === "COMPLETED";

  useEffect(() => {
    console.log("isOpen:", isOpen);
    console.log("fileName:", fileName);
    console.log("projectId:", projectId);
    console.log("isFileReady:", isFileReady);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (isFileReady) {
        fetchMetadata();
      } else {
        // Si le fichier n'est pas prêt, on reste en état de chargement
        setIsLoading(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (!response) {
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

  // Fonction pour rendre un tableau à partir d'un array
  const renderTable = (array: unknown[]) => {
    if (array.length === 0) return <p>Aucune donnée</p>;

    // Vérifier si les éléments sont des objets
    const isObjectArray = array.every(
      (item) => typeof item === "object" && item !== null,
    );

    if (isObjectArray) {
      // Extraire les clés pour les en-têtes du tableau
      const firstItem = array[0] as Record<string, unknown>;
      const headers = Object.keys(firstItem);

      const columns = headers.map((header) => ({
        accessorKey: header,
        header: header,
        cell: ({ row }: { row: Row<Record<string, unknown>> }) =>
          renderMetadataValue(row.getValue(header)),
      }));

      return (
        <div className="rounded-lg overflow-hidden">
          <DataTable
            columns={columns}
            data={array as Record<string, unknown>[]}
          />
        </div>
      );
    } else {
      // Pour les tableaux de valeurs simples
      const columns = [
        {
          accessorKey: "index",
          header: "Index",
        },
        {
          accessorKey: "value",
          header: "Valeur",
          cell: ({ row }: { row: Row<{ index: number; value: unknown }> }) =>
            renderMetadataValue(row.getValue("value")),
        },
      ];

      const data = array.map((item, index) => ({
        index,
        value: item,
      }));

      return (
        <div className="border rounded-lg overflow-hidden">
          <DataTable columns={columns} data={data} />
        </div>
      );
    }
  };

  // Fonction pour rendre une valeur de métadonnée, quelle que soit sa structure
  const renderMetadataValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return "N/A";
    }

    // Si la valeur est un objet, on cherche s'il contient un tableau à afficher directement
    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      // Vérifier si l'objet ne contient qu'un seul tableau ou si la plupart des propriétés sont des tableaux
      const entries = Object.entries(value as Record<string, unknown>);

      // Si l'objet n'a qu'une seule propriété et que c'est un tableau, on l'affiche directement
      if (entries.length === 1 && Array.isArray(entries[0][1])) {
        return renderTable(entries[0][1] as unknown[]);
      }

      // Si l'objet a plusieurs propriétés, on cherche un tableau qui pourrait être le contenu principal
      const values = Object.values(value as Record<string, unknown>);
      for (const val of values) {
        if (
          Array.isArray(val) &&
          val.length > 0 &&
          typeof val[0] === "object"
        ) {
          // Si on trouve un tableau d'objets, c'est probablement notre tableau principal
          return renderTable(val);
        }
      }

      // Si on n'a pas trouvé de tableau principal, on affiche l'objet normalement
      return (
        <div className="space-y-1">
          {entries.map(([key, val]) => (
            <div key={key} className="border rounded-md p-2">
              <span className="font-medium">{key}: </span>
              {renderMetadataValue(val)}
            </div>
          ))}
        </div>
      );
    }

    // Si la valeur est déjà un tableau, on l'affiche directement
    if (Array.isArray(value)) {
      return renderTable(value);
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

  // Préparer les données pour les onglets
  const getTabsData = () => {
    if (!metadata) return { tabs: [], panels: [] };

    if (Array.isArray(metadata)) {
      return {
        tabs: metadata.map((item: MetadataItem) => item.key),
        panels: metadata.map((item: MetadataItem) => item.value),
      };
    } else {
      const keys = Object.keys(metadata);
      return {
        tabs: keys,
        panels: keys.map((key) => (metadata as Record<string, unknown>)[key]),
      };
    }
  };

  const { tabs, panels } = getTabsData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden flex flex-col">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {fileName}
          </DialogTitle>
        </DialogHeader>

        {!isFileReady || isLoading ? (
          <ScrollArea className="flex-grow">
            <div>
              {!isFileReady && (
                <div className="mb-6 text-amber-600 text-sm">
                  Le document est en cours de traitement. Les métadonnées seront
                  disponibles une fois le traitement terminé.
                </div>
              )}
              <MetadataSkeleton />
            </div>
          </ScrollArea>
        ) : error ? (
          <div className="flex items-center justify-center flex-grow text-red-500">
            {error}
          </div>
        ) : (
          <div className="flex-grow flex flex-col overflow-hidden">
            <AnimatedTabs
              tabs={tabs.map((tab) => String(tab))}
              defaultIndex={0}
              onChange={setTabIndex}
              className="mb-4 flex-shrink-0"
            />
            <div className="flex-grow overflow-hidden">
              {panels.map((panel, index) => (
                <AnimatedTabsContent
                  key={index}
                  value={tabIndex}
                  index={index}
                  className="h-full"
                >
                  <ScrollArea className="h-full">
                    <div className="pr-4 pb-4">
                      {renderMetadataValue(panel)}
                    </div>
                  </ScrollArea>
                </AnimatedTabsContent>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button onClick={onOpenDocument} disabled={isLoading && isFileReady}>
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            Ouvrir le fichier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
