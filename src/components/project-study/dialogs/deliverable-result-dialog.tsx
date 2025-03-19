"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  AnimatedTabs,
  AnimatedTabsContent,
} from "@/src/components/ui/animated-tabs";
import { DataTable } from "@/src/components/ui/data-table";
import type { Row } from "@tanstack/react-table";
import { RenderMarkdown } from "@/src/components/ui/render-markdown";

interface Deliverable {
  id: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
  short_result?: {
    result: string | Record<string, unknown>;
  };
  long_result?: {
    result: string | Record<string, unknown>;
  };
  [key: string]: unknown;
}

interface DeliverableResultDialogProps {
  deliverableId: string;
  toolName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeliverableResultDialog({
  deliverableId,
  toolName,
  isOpen,
  onOpenChange,
}: DeliverableResultDialogProps) {
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [contents, setContents] = useState<
    (string | Record<string, unknown> | null)[]
  >([]);
  const [tabs, setTabs] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && deliverableId) {
      fetchDeliverable();
    }
    // eslint-disable-next-line
  }, [isOpen, deliverableId]);

  useEffect(() => {
    if (!deliverable) {
      return;
    }

    if (deliverable) {
      console.log("UseEFFECT deliverable:", deliverable);
      const { tabs, contents } = getTabsData(deliverable);
      setTabs(tabs);
      setContents(contents);
    }
  }, [deliverable]);

  useEffect(() => {
    console.log("tabs:", tabs);
    console.log("contents:", contents);

    if (tabs.length > 0 && contents.length > 0) {
      setIsLoading(false);
    }
  }, [tabs, contents]);

  const fetchDeliverable = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/deliverables/${deliverableId}`);

      if (!response.ok) {
        throw new Error("Impossible de récupérer les résultats du livrable");
      }

      const data = await response.json();
      console.log("Deliverable data:", data);
      setDeliverable(data);
    } catch (error) {
      console.error("Error fetching deliverable:", error);
      setError("Une erreur est survenue lors de la récupération des résultats");
    }
  };

  const getTabTitle = (type: string) => {
    switch (type) {
      case "DESCRIPTIF_SOMMAIRE_DES_TRAVAUX":
        return "Descriptif sommaire des travaux";
      case "COMPARATEUR_INDICES":
        return "Comparaison d'indices";
      case "ANALYSE_ETHUDE_THERMIQUE":
        return "Analyse thermique";
      case "INCOHERENCE_DE_DONNEES":
        return "Incohérences détectées";
      case "SUGGESTIONS":
        return "Suggestions d'amélioration";
      default:
        return "Résultats";
    }
  };

  // Fonction pour rendre un tableau à partir d'un array
  const renderTable = (array: unknown[]) => {
    console.log("renderTable:", array);

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
        cell: ({ row }: { row: Row<Record<string, unknown>> }) => {
          const value = row.getValue(header);

          // Vérifier si la valeur est un tableau de chaînes
          if (
            Array.isArray(value) &&
            value.every((item) => typeof item === "string")
          ) {
            return (
              <div className="flex flex-wrap gap-1">
                {value.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            );
          }

          return renderResultValue(value);
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
    } else {
      // Pour les tableaux de valeurs simples
      return (
        <div className="border rounded-md p-2">
          <ul className="list-disc pl-5">
            {array.map((item, index) => (
              <li key={index}>{renderResultValue(item)}</li>
            ))}
          </ul>
        </div>
      );
    }
  };

  // Fonction pour rendre un objet
  const renderObject = (obj: Record<string, unknown>) => {
    const entries = Object.entries(obj);

    // Si l'objet a une propriété "result", on l'affiche directement
    if (obj.result !== undefined) {
      return renderResultValue(obj.result);
    }

    return (
      <div className="space-y-1">
        {entries.map(([key, val]) => (
          <div key={key} className="border rounded-md p-2">
            <span className="font-medium">{key}: </span>
            {renderResultValue(val)}
          </div>
        ))}
      </div>
    );
  };

  // Fonction générique pour rendre n'importe quel type de valeur
  const renderResultValue = (value: unknown): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">Non disponible</span>;
    }

    if (typeof value === "string") {
      // Vérifier si c'est du JSON
      try {
        const jsonData = JSON.parse(value);
        return renderResultValue(jsonData);
      } catch {
        // Si ce n'est pas du JSON, on utilise le composant RenderMarkdown
        return <RenderMarkdown content={value} />;
      }
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    if (Array.isArray(value)) {
      return renderTable(value);
    }

    if (typeof value === "object") {
      return renderObject(value as Record<string, unknown>);
    }

    return String(value);
  };

  // Préparer les données pour les onglets
  const getTabsData = (deliverable: Deliverable) => {
    if (!deliverable || !deliverable.short_result || !deliverable.long_result) {
      return {
        tabs: ["Résumé", "Analyse complète"],
        contents: [null, null],
      };
    }

    console.log("long_result:", deliverable.long_result);
    console.log("short_result:", deliverable.short_result);

    return {
      tabs: ["Résumé", "Analyse complète"],
      contents: [
        deliverable.short_result.result,
        deliverable.long_result.result,
      ],
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden flex flex-col">
        <DialogHeader className="pb-2 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {toolName || getTabTitle(deliverable?.type || "")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Résultats du livrable{" "}
            {toolName || getTabTitle(deliverable?.type || "")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col space-y-4 py-4 flex-grow">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">
                Chargement des résultats...
              </span>
            </div>
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : error ? (
          <div className="py-6 text-center text-red-500 flex-grow">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchDeliverable}
            >
              Réessayer
            </Button>
          </div>
        ) : deliverable ? (
          <div className="flex-grow flex flex-col overflow-hidden">
            <AnimatedTabs
              tabs={tabs}
              defaultIndex={0}
              onChange={setTabIndex}
              className="mb-4 flex-shrink-0"
            />
            <div className="flex-grow overflow-hidden">
              {!isLoading &&
                contents.map((content, index) => (
                  <AnimatedTabsContent
                    key={index}
                    value={tabIndex}
                    index={index}
                    className="h-full"
                  >
                    <ScrollArea className="h-full">
                      <div className="pr-4 pb-4">
                        {content ? (
                          renderResultValue(content)
                        ) : (
                          <div className="rounded-md border p-4 bg-gray-50">
                            <p className="text-gray-500 italic">
                              {index === 0
                                ? "Aucun résumé disponible"
                                : "Aucune analyse complète disponible"}
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </AnimatedTabsContent>
                ))}
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-gray-500 flex-grow">
            <p>Aucun résultat disponible</p>
          </div>
        )}

        <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
