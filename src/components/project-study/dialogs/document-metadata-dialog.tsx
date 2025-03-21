"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
  onOpenDocument: (pageNumber?: number) => void;
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

  // Reset tab index when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTabIndex(0);
    }
  }, [isOpen]);

  const fetchMetadata = useCallback(async () => {
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
      setMetadata(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Impossible de récupérer les métadonnées du document");
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsLoading(false);
    }
  }, [fileName, projectId]);

  useEffect(() => {
    if (!isOpen) return;
    if (!fileName) return;
    if (!projectId) return;
    if (!fetchMetadata) return;

    console.log("Fetching ai_metadatas for file:", fileName);

    if (isOpen) {
      if (isFileReady) {
        fetchMetadata();
      } else {
        setIsLoading(true);
      }
    }
  }, [isOpen, fileName, projectId, isFileReady, fetchMetadata]);

  // Préparer les données pour les onglets
  const getTabsData = () => {
    if (!metadata) return { tabs: [], panels: [] };

    // Vérifier si nous avons une structure avec __data et __fieldOrder au niveau supérieur
    if (
      typeof metadata === "object" &&
      !Array.isArray(metadata) &&
      metadata.__data &&
      metadata.__fieldOrder
    ) {
      // Récupérer l'ordre des onglets depuis __fieldOrder
      const fieldOrder = metadata.__fieldOrder as string[];
      const rootData = metadata.__data as Record<string, unknown>;

      // Créer les tabs dans l'ordre spécifié par __fieldOrder
      const orderedTabs = fieldOrder;

      // Créer les panels correspondants en accédant aux données dans __data
      const panels = orderedTabs.map((tab) => rootData[tab]);

      return { tabs: orderedTabs, panels };
    }

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

  // Fonction pour rendre un tableau à partir d'un array
  const renderTable = (array: unknown[]) => {
    if (array.length === 0) return <p>Aucune donnée</p>;

    // Vérifier si les éléments sont des objets
    const isObjectArray = array.every(
      (item) => typeof item === "object" && item !== null,
    );

    if (isObjectArray) {
      // Vérifier si nous avons une structure avec __data et __fieldOrder
      const firstItem = array[0] as Record<string, unknown>;

      // Cas où l'objet contient __data et __fieldOrder
      if (
        firstItem.__data !== undefined &&
        firstItem.__fieldOrder !== undefined &&
        Array.isArray(firstItem.__fieldOrder)
      ) {
        // Récupérer l'ordre des champs depuis __fieldOrder du premier élément
        const fieldOrder = firstItem.__fieldOrder as string[];

        // Créer les colonnes en respectant l'ordre défini
        const columns = fieldOrder.map((field) => ({
          accessorKey: field,
          header: field,
          cell: ({ row }: { row: Row<Record<string, unknown>> }) => {
            // Si le champ est "Page", rendre un lien cliquable
            if (field === "Page") {
              const pageNumber = row.getValue(field);
              if (Number(pageNumber) === 0) {
                return "-";
              } else {
                return (
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline"
                    onClick={() => handlePageClick(Number(pageNumber))}
                  >
                    {String(pageNumber)}
                  </Button>
                );
              }
            }
            return renderMetadataValue(row.getValue(field));
          },
        }));

        // Transformer les données pour l'affichage
        const tableData = array.map((item) => {
          const dataItem = (item as Record<string, unknown>).__data;
          return dataItem && typeof dataItem === "object"
            ? (dataItem as Record<string, unknown>)
            : {};
        });

        return (
          <div className="rounded-lg overflow-hidden">
            <DataTable columns={columns} data={tableData} />
          </div>
        );
      } else {
        // Cas standard : utiliser les clés de l'objet directement
        const headers = Object.keys(firstItem);

        // Filtrer les clés spéciales comme __fieldOrder pour qu'elles n'apparaissent pas dans le tableau
        const filteredHeaders = headers.filter(
          (header) => !header.startsWith("__"),
        );

        // Si l'objet a un __fieldOrder, l'utiliser pour ordonner les colonnes
        let orderedHeaders = filteredHeaders;
        if (firstItem.__fieldOrder && Array.isArray(firstItem.__fieldOrder)) {
          const fieldOrder = firstItem.__fieldOrder as string[];
          // Ordonner les en-têtes selon fieldOrder, puis ajouter les en-têtes qui ne sont pas dans fieldOrder
          orderedHeaders = [
            ...fieldOrder.filter((field) => filteredHeaders.includes(field)),
            ...filteredHeaders.filter((header) => !fieldOrder.includes(header)),
          ];
        }

        const columns = orderedHeaders.map((header) => ({
          accessorKey: header,
          header: header,
          cell: ({ row }: { row: Row<Record<string, unknown>> }) => {
            // Si le champ est "Page", rendre un lien cliquable
            if (header === "Page") {
              const pageNumber = row.getValue(header);
              return (
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => handlePageClick(Number(pageNumber))}
                >
                  {String(pageNumber)}
                </Button>
              );
            }
            return renderMetadataValue(row.getValue(header));
          },
        }));

        return (
          <div className="rounded-lg overflow-hidden">
            <DataTable
              columns={columns}
              data={array as Record<string, unknown>[]}
            />
          </div>
        );
      }
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
          cell: ({ row }: { row: Row<{ index: number; value: unknown }> }) => {
            const value = row.getValue("value");
            // Si la valeur est un numéro de page (vérifier si c'est un nombre et si la clé est "Page")
            // Convertir l'index en string pour la comparaison
            if (
              typeof value === "number" &&
              String(row.original.index) === "Page"
            ) {
              return (
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => handlePageClick(value)}
                >
                  {value}
                </Button>
              );
            }
            return renderMetadataValue(value);
          },
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
      const objValue = value as Record<string, unknown>;

      // Vérifier si nous avons une structure avec __data et __fieldOrder
      if (
        objValue.__data &&
        objValue.__fieldOrder &&
        Array.isArray(objValue.__fieldOrder)
      ) {
        // Si c'est un tableau (__isArray est true), on l'affiche directement
        if (objValue.__isArray && Array.isArray(objValue.__data)) {
          // Ajouter __fieldOrder à chaque élément du tableau pour que renderTable puisse l'utiliser
          // mais s'assurer que __fieldOrder ne sera pas affiché comme une colonne
          const dataWithFieldOrder = objValue.__data.map((item) => {
            if (typeof item === "object" && item !== null) {
              // Utiliser Symbol pour s'assurer que __fieldOrder ne sera pas énuméré
              // lors de la création des colonnes
              return {
                ...(item as object),
                __fieldOrder: objValue.__fieldOrder,
              };
            }
            return item;
          });

          return renderTable(dataWithFieldOrder);
        }

        // Sinon, on utilise __data comme valeur principale
        return renderMetadataValue(objValue.__data);
      }

      // Vérifier si l'objet ne contient qu'un seul tableau ou si la plupart des propriétés sont des tableaux
      const entries = Object.entries(objValue);

      // Si l'objet n'a qu'une seule propriété et que c'est un tableau, on l'affiche directement
      if (entries.length === 1 && Array.isArray(entries[0][1])) {
        return renderTable(entries[0][1] as unknown[]);
      }

      // Si l'objet a plusieurs propriétés, on cherche un tableau qui pourrait être le contenu principal
      const values = Object.values(objValue);
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

  // Fonction intermédiaire pour gérer le clic sur un numéro de page
  const handlePageClick = (pageNumber: number) => {
    onOpenDocument(pageNumber);
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
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden flex flex-col">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {fileName}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Métadonnées du document {fileName}
          </DialogDescription>
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
          <Button
            onClick={() => onOpenDocument(0)}
            disabled={isLoading && isFileReady}
          >
            <ExternalLinkIcon className="mr-2 h-4 w-4" />
            Ouvrir le fichier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
