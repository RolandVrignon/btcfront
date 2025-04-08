"use client";

import { useState, useEffect, memo } from "react";
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
import { RefreshCw, ChevronDown } from "lucide-react";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  AnimatedTabs,
  AnimatedTabsContent,
} from "@/src/components/ui/animated-tabs";
import { DataTable } from "@/src/components/ui/data-table";
import type { Row } from "@tanstack/react-table";
import { RenderMarkdown } from "@/src/components/ui/render-markdown";
import { UploadingFile } from "@/src/types/type";
import { FileSelectionDialog } from "./select-infos-deliverable-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { logger } from "@/src/utils/logger";
import { format } from "date-fns";

interface Document {
  id: string;
  name: string;
  type: string;
  selected: boolean;
}

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
  createdAt: string;
  [key: string]: unknown;
  process_duration_in_seconds: number;
}

interface DeliverableIds {
  id: string[];
  toolName: string;
}

interface DeliverableResultDialogProps {
  deliverableIds: string[];
  toolName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  uploadFiles?: UploadingFile[];
  projectId: string | null;
  setDeliverableIds?: React.Dispatch<
    React.SetStateAction<DeliverableIds | null>
  >;
}

// Ajout d'une interface pour l'élément DocumentItem
interface DocumentItemProps {
  document: Document;
  onToggleSelection: (id: string, selected: boolean) => void;
}

// Composant mémorisé pour l'élément de document (ne se re-rend que si ses props changent)
const DocumentItem = memo(
  ({ document, onToggleSelection }: DocumentItemProps) => {
    const [isSelected, setIsSelected] = useState(document.selected);

    const handleChange = () => {
      const newSelectedState = !isSelected;
      setIsSelected(newSelectedState);
      onToggleSelection(document.id, newSelectedState);
    };

    return (
      <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={`doc-${document.id}`}
            checked={isSelected}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
        <label
          htmlFor={`doc-${document.id}`}
          className="text-sm font-medium text-gray-900 cursor-pointer flex-grow"
        >
          {document.name}
          <span className="ml-2 text-xs text-gray-500">({document.type})</span>
        </label>
      </div>
    );
  },
);

DocumentItem.displayName = "DocumentItem";

export function DeliverableResultDialog({
  deliverableIds,
  toolName,
  isOpen,
  onOpenChange,
  uploadFiles,
  projectId,
  setDeliverableIds,
}: DeliverableResultDialogProps) {
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [contents, setContents] = useState<
    (string | Record<string, unknown> | null)[]
  >([]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(
    null,
  );

  // Documents selection system
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<UploadingFile[]>(
    [],
  );
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [remarks, setRemarks] = useState<string>("");
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  // Reset tab index when dialog closes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }

    if (!isOpen) {
      setTabIndex(0);
      // Clear polling interval when dialog closes
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isOpen, pollingInterval]);

  // Effect to set the current version index to the latest version when deliverableIds changes
  useEffect(() => {
    logger.info("deliverableIds changed:", deliverableIds);

    if (deliverableIds && deliverableIds.length > 0) {
      logger.info("deliverableIds:", deliverableIds);
      setCurrentVersionIndex(deliverableIds.length - 1);
      logger.info(
        `Mise à jour de la version courante: ${deliverableIds.length - 1 + 1}`,
      );
    }
  }, [deliverableIds]);

  // Effect to fetch deliverable when deliverableIds changes or dialog opens
  useEffect(() => {
    if (
      isOpen &&
      deliverableIds &&
      deliverableIds.length > 0 &&
      currentVersionIndex !== null
    ) {
      // Fetch the selected version
      const selectedDeliverableId = deliverableIds[currentVersionIndex];
      if (selectedDeliverableId) {
        fetchDeliverable(selectedDeliverableId, false);
      }
    }
    // eslint-disable-next-line
  }, [isOpen, deliverableIds, currentVersionIndex]);

  // Initialiser les documents sélectionnés quand le dialogue de régénération s'ouvre
  useEffect(() => {
    logger.info("isRegenerateDialogOpen", isRegenerateDialogOpen);
    logger.info("uploadFiles", uploadFiles);
    logger.info("uploadFiles length", uploadFiles?.length);
    if (isRegenerateDialogOpen && uploadFiles && uploadFiles.length > 0) {
      // Présélectionner tous les documents
      setSelectedDocuments([...uploadFiles]);
    }
  }, [isRegenerateDialogOpen, uploadFiles]);

  // Effect to handle polling for pending or processing deliverables
  useEffect(() => {
    // Si le composant est en chargement et qu'on a un deliverable, on met en place le polling
    if (isLoading && deliverable) {
      // Si on n'a pas déjà un intervalle de polling actif
      if (!pollingInterval) {
        logger.debug("Starting polling for deliverable:", deliverable.id);

        const interval = setInterval(() => {
          if (deliverableIds && deliverableIds.length > 0) {
            const latestId = deliverableIds[deliverableIds.length - 1];
            logger.debug("Polling deliverable:", latestId);
            fetchDeliverable(latestId, false); // Don't reset loading state between polls
          }
        }, 3000); // Poll every 3 seconds

        setPollingInterval(interval);
      }
    }
    // Si le deliverable est complété ou en erreur, on arrête le polling
    else if (
      pollingInterval &&
      deliverable &&
      (deliverable.status === "COMPLETED" || deliverable.status === "ERROR")
    ) {
      logger.debug(
        "Stopping polling for deliverable:",
        deliverable.id,
        "with status:",
        deliverable.status,
      );
      clearInterval(pollingInterval);
      setPollingInterval(null);

      // On met fin à l'état de chargement si on est complété
      if (deliverable.status === "COMPLETED") {
        setIsLoading(false);
      }
    }

    return () => {
      if (pollingInterval) {
        logger.debug("Cleaning up polling interval");
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [deliverable, deliverableIds, pollingInterval, isLoading]);

  // Cet useEffect est déclenché quand le deliverable change
  useEffect(() => {
    if (!deliverable) {
      return;
    }

    logger.debug("Deliverable status changed to:", deliverable.status);

    // Seulement mettre à jour les tabs et contents si le deliverable est complété
    if (deliverable.status === "COMPLETED") {
      logger.debug("Deliverable is COMPLETED, updating tabs and contents");
      const { tabs, contents } = getTabsData(deliverable);
      setTabs(tabs);
      setContents(contents);
      setIsLoading(false);
    }
    // Maintenir l'état de chargement si le deliverable est en attente ou en cours
    else if (
      deliverable.status === "PENDING" ||
      deliverable.status === "PROCESSING"
    ) {
      setIsLoading(true);
    }
    // En cas d'erreur, on arrête le chargement
    else if (deliverable.status === "ERROR") {
      setIsLoading(false);
    }
  }, [deliverable]);

  useEffect(() => {
    logger.debug("tabs:", tabs);
    logger.debug("contents:", contents);

    if (tabs.length > 0 && contents.length > 0) {
      setIsLoading(false);
    }
  }, [tabs, contents]);

  const fetchDeliverable = async (
    deliverableId: string,
    resetLoading = true,
  ) => {
    try {
      if (resetLoading) {
        setIsLoading(true);
      }
      setError(null);

      logger.info("Fetching deliverable:", deliverableId);

      const response = await fetch(`/api/deliverables/${deliverableId}`);

      logger.info("Response:", response);
      if (!response.ok) {
        throw new Error("Impossible de récupérer les résultats du livrable");
      }

      const data = await response.json();
      logger.info("Deliverable data:", data);
      setDeliverable(data);

      // If status is completed, we can stop loading
      if (data.status === "COMPLETED") {
        setIsLoading(false);
      }
      // Keep loading for PENDING or PROCESSING statuses
    } catch (error) {
      logger.error("Error fetching deliverable:", error);
      setError("Une erreur est survenue lors de la récupération des résultats");
      setIsLoading(false);
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
    logger.debug("renderTable:", array);

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

    logger.debug("long_result:", deliverable.long_result);
    logger.debug("short_result:", deliverable.short_result);

    return {
      tabs: ["Résumé", "Analyse complète"],
      contents: [
        deliverable.short_result.result,
        deliverable.long_result.result,
      ],
    };
  };

  const handleRegenerateDeliverable = async () => {
    try {
      setIsRegenerating(true);

      const selectedIds = selectedDocuments.map((doc) => doc.id);

      if (selectedIds.length === 0) {
        alert("Veuillez sélectionner au moins un document");
        setIsRegenerating(false);
        return;
      }

      // Appeler l'API pour régénérer le livrable
      const response = await fetch(`/api/deliverables/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          type: deliverable?.type,
          documentIds: selectedIds,
          user_prompt: remarks.trim() || undefined,
          new: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de régénérer le livrable");
      }

      // L'API retourne maintenant un tableau de livrables
      const newDeliverable = await response.json();

      logger.info("Our new deliverable:", newDeliverable);

      setIsRegenerateDialogOpen(false);
      setRemarks("");
      setIsRegenerating(false);

      // Ajouter le nouvel ID au tableau de deliverableIds
      if (setDeliverableIds && newDeliverable.id) {
        logger.info(`Ajout d'un nouveau deliverable: ${newDeliverable.id}`);
        setDeliverableIds((prev) => {
          if (!prev) {
            return {
              id: [newDeliverable.id],
              toolName: toolName,
            };
          }
          const newIds = [...prev.id, newDeliverable.id];
          return {
            id: newIds,
            toolName: prev.toolName,
          };
        });
      }

      // Mettre immédiatement le composant en état de chargement
      setIsLoading(true);
    } catch (error) {
      logger.error("Error regenerating deliverable:", error);
      setIsRegenerating(false);
      alert("Une erreur est survenue lors de la régénération du livrable");
    }
  };

  const handleVersionSelect = (index: number) => {
    if (index !== currentVersionIndex) {
      setCurrentVersionIndex(index);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogHeader>
          <DialogTitle className="sr-only">{toolName}</DialogTitle>
          <DialogDescription className="sr-only">
            {deliverable &&
              `Créé le ${format(new Date(deliverable.createdAt), "dd/MM/yyyy à HH:mm")}`}
          </DialogDescription>
        </DialogHeader>
        <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <DialogHeader className="pb-0 flex-shrink-0 m-0 p-0">
              <DialogTitle className="text-xl font-semibold">
                {toolName || getTabTitle(deliverable?.type || "")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Résultats du livrable{" "}
                {toolName || getTabTitle(deliverable?.type || "")}
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 mr-8">
              {deliverable && deliverable.status === "COMPLETED" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg
                    className="w-4 h-4 mr-1.5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Généré le{" "}
                  {format(
                    new Date(deliverable.createdAt),
                    "dd/MM/yyyy à HH:mm",
                  )}{" "}
                  en {Math.round(deliverable.process_duration_in_seconds)}{" "}
                  secondes
                </span>
              )}
              {deliverable && deliverable.status === "ERROR" && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  <svg
                    className="w-4 h-4 mr-1.5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Erreur lors de la génération
                </span>
              )}
              {deliverable &&
                (deliverable.status === "PENDING" ||
                  deliverable.status === "PROCESSING") && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <svg
                      className="w-4 h-4 mr-1.5 text-yellow-500 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    En cours de génération...
                  </span>
                )}
              {deliverableIds && deliverableIds.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={isLoading}
                    >
                      {currentVersionIndex !== null
                        ? `v${currentVersionIndex + 1}`
                        : "Versions"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {deliverableIds.map((_, index) => (
                      <DropdownMenuItem
                        key={index}
                        className={
                          currentVersionIndex === index
                            ? "cursor-pointer bg-gray-100"
                            : "cursor-pointer"
                        }
                        onClick={() => handleVersionSelect(index)}
                      >
                        v{index + 1}
                        {index === deliverableIds.length - 1 && " (dernière)"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => setIsRegenerateDialogOpen(true)}
                disabled={isLoading || deliverable?.status !== "COMPLETED"}
              >
                <RefreshCw className="h-4 w-4" />
                Régénérer
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col space-y-4 py-4 flex-grow">
              <Skeleton className="h-full w-full" />
            </div>
          ) : error ? (
            <div className="py-6 text-center text-red-500 flex-grow">
              <p>{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() =>
                  deliverableIds &&
                  deliverableIds.length > 0 &&
                  fetchDeliverable(
                    deliverableIds[deliverableIds.length - 1],
                    false,
                  )
                }
              >
                Réessayer
              </Button>
            </div>
          ) : deliverable && deliverable.status === "COMPLETED" ? (
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
          ) : deliverable && deliverable.status === "ERROR" ? (
            <div className="py-6 text-center text-red-500 flex-grow">
              <p>Une erreur est survenue lors de la génération du livrable</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsRegenerateDialogOpen(true)}
              >
                Essayer de régénérer
              </Button>
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

      {/* Utiliser le composant FileSelectionDialog pour la sélection des documents */}
      <FileSelectionDialog
        isOpen={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
        uploadFiles={uploadFiles || []}
        selectedFiles={selectedDocuments}
        setSelectedFiles={setSelectedDocuments}
        onRegenerateClick={handleRegenerateDeliverable}
        isRegenerating={isRegenerating}
        title="Sélectionner les documents"
        description="Choisissez les documents à utiliser pour la régénération du livrable."
        remarks={remarks}
        setRemarks={setRemarks}
      />
    </>
  );
}
