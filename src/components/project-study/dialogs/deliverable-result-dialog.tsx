"use client";

import { useState, useEffect, useRef, memo } from "react";
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
import { useDeliverableSocket } from "@/src/hooks/use-deliverable-socket";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { ProgressBadge } from "@/src/components/project-study/components/ProgressBadge";

interface Document {
  id: string;
  name: string;
  type: string;
  selected: boolean;
}

interface Deliverable {
  id: string;
  type: string;
  status: "PENDING" | "PROGRESS" | "COMPLETED" | "ERROR";
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
  uploadFiles?: UploadingFile[] | [];
  projectId: string | null;
  setDeliverableIds?: React.Dispatch<
    React.SetStateAction<DeliverableIds | null>
  >;
  onDeliverableLoaded?: () => void;
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
  onDeliverableLoaded,
}: DeliverableResultDialogProps) {
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Use a ref to store the polling interval to avoid infinite update loop
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to capture the deliverable result for PDF generation
  const resultRef = useRef<HTMLDivElement | null>(null);

  const [pendingDeliverable, setPendingDeliverable] = useState<{
    id: string[];
    toolName: string;
  } | null>(null);

  useDeliverableSocket(projectId || "", async (data) => {
    const deliverable = await fetch(`/api/deliverables/${data.id}`);
    const deliverableData = await deliverable.json();
    setDeliverable(deliverableData);
  });

  // Reset tab index when dialog closes
  useEffect(() => {
    if (isOpen) {
      setDeliverable(null);
      setIsLoading(true);
    }

    if (!isOpen) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Effect to set the current version index to the latest version when deliverableIds changes
  useEffect(() => {
    logger.info("deliverableIds changed:", deliverableIds);

    if (deliverableIds && deliverableIds.length > 0) {
      logger.info("deliverableIds:", deliverableIds);
      setIsLoading(true);
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
        fetchDeliverable(selectedDeliverableId, false).then(() => {
          if (onDeliverableLoaded) onDeliverableLoaded();
        });
      }
    }
  }, [isOpen, deliverableIds, currentVersionIndex, onDeliverableLoaded]);

  // Initialiser les documents sélectionnés quand le dialogue de régénération s'ouvre
  useEffect(() => {
    if (uploadFiles && uploadFiles.length > 0) {
      setSelectedDocuments(uploadFiles);
    }
  }, [isRegenerateDialogOpen, uploadFiles]);

  // Effect to handle polling for pending or processing deliverables
  useEffect(() => {
    // If loading and we have a deliverable, start polling
    if (isLoading && deliverable) {
      if (!pollingIntervalRef.current) {
        logger.debug("Starting polling for deliverable:", deliverable.id);
        const interval = setInterval(() => {
          if (deliverableIds && deliverableIds.length > 0) {
            const latestId = deliverableIds[deliverableIds.length - 1];
            logger.debug("Polling deliverable:", latestId);
            fetchDeliverable(latestId, false);
          }
        }, 3000);
        pollingIntervalRef.current = interval;
      }
    } else if (
      pollingIntervalRef.current &&
      deliverable &&
      (deliverable.status === "COMPLETED" || deliverable.status === "ERROR")
    ) {
      logger.debug(
        "Stopping polling for deliverable:",
        deliverable.id,
        "with status:",
        deliverable.status,
      );
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      if (deliverable.status === "COMPLETED") {
        setIsLoading(false);
      }
    }
    return () => {
      if (pollingIntervalRef.current) {
        logger.debug("Cleaning up polling interval");
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [deliverable, deliverableIds, isLoading]);

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
      deliverable.status === "PROGRESS"
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
    return;
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

          // Afficher les tableaux comme des badges
          if (Array.isArray(value)) {
            return (
              <div className="flex flex-wrap gap-1">
                {value.length === 0 ? (
                  <span className="text-gray-400">Aucune donnée</span>
                ) : (
                  value.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {typeof item === "object" && item !== null
                        ? JSON.stringify(item)
                        : String(item)}
                    </span>
                  ))
                )}
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
      // Pour les tableaux de valeurs simples, afficher en liste avec badges
      return (
        <div className="flex flex-wrap gap-1 p-2">
          {array.map((item, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {renderResultValue(item)}
            </span>
          ))}
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

    // Vérifier s'il s'agit d'un FieldOrderObject
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      Object.prototype.hasOwnProperty.call(value, "__data") &&
      Object.prototype.hasOwnProperty.call(value, "__isArray")
    ) {
      const fieldOrderObj = value as Record<string, unknown>;
      return renderFieldOrderObject(fieldOrderObj);
    }

    // Vérifier si la valeur est une date (format ISO ou autre format standard)
    if (typeof value === "string") {
      // Essayer de détecter et formater une date
      try {
        // Vérifier si la chaîne ressemble à une date
        if (
          value.match(/^\d{4}-\d{2}-\d{2}/) || // Format ISO
          value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/) || // Format ISO avec heure
          value.includes("Z") || // Possiblement une date avec fuseau horaire
          value.endsWith("Z") ||
          (value.length > 10 &&
            value.length < 30 &&
            value.includes("-") &&
            value.includes(":"))
        ) {
          const dateObj = new Date(value);
          if (!isNaN(dateObj.getTime())) {
            return format(dateObj, "dd/MM/yyyy à HH:mm");
          }
        }
      } catch {
        // Si la conversion échoue, continuer avec la valeur d'origine
      }

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

  // Fonction pour rendre un FieldOrderObject
  const renderFieldOrderObject = (
    obj: Record<string, unknown>,
  ): React.ReactNode => {
    // Récupérer les données et l'ordre des champs
    const data = obj.__data;
    const isArray = obj.__isArray as boolean;
    const fieldOrder = (obj.__fieldOrder as string[]) || [];

    // Si ce n'est pas un tableau, on renvoie simplement la valeur
    if (!isArray) {
      return renderResultValue(data);
    }

    // Si c'est un tableau de données, on crée un tableau avec un ordre spécifique
    if (Array.isArray(data)) {
      // Extraire les vraies valeurs des objets __data dans chaque élément du tableau
      const processedData = data.map((item) => {
        if (typeof item !== "object" || item === null) return item;

        // Créer un nouvel objet avec les valeurs extraites
        const processedItem: Record<string, unknown> = {};

        // Pour chaque propriété dans l'élément
        Object.entries(item).forEach(([key, value]) => {
          // Ignorer les propriétés spéciales comme __fieldOrder
          if (key === "__fieldOrder") return;

          // Si la valeur est un objet avec __data, extraire cette valeur
          if (
            typeof value === "object" &&
            value !== null &&
            "__data" in value
          ) {
            processedItem[key] = (value as Record<string, unknown>).__data;
          }
          // Si la valeur est un tableau d'objets avec __data, extraire pour chaque élément
          else if (
            Array.isArray(value) &&
            value.length > 0 &&
            typeof value[0] === "object" &&
            value[0] !== null &&
            "__data" in value[0]
          ) {
            processedItem[key] = value.map(
              (v) => (v as Record<string, unknown>).__data,
            );
          }
          // Sinon, utiliser la valeur telle quelle
          else {
            processedItem[key] = value;
          }
        });

        return processedItem;
      });

      // Si les données contiennent des objets avec des clés spécifiques, on utilise fieldOrder pour l'ordre des colonnes
      const isStructuredData =
        processedData.length > 0 &&
        typeof processedData[0] === "object" &&
        processedData[0] !== null;

      if (isStructuredData && fieldOrder.length > 0) {
        // Créer un tableau avec les colonnes selon l'ordre défini
        const columns = fieldOrder.map((key) => ({
          accessorKey: key,
          header: key,
          cell: ({ row }: { row: Row<Record<string, unknown>> }) => {
            const cellValue = row.getValue(key);

            // Rendre les tableaux comme des badges
            if (Array.isArray(cellValue)) {
              return (
                <div className="flex flex-wrap gap-1">
                  {cellValue.length === 0 ? (
                    <span className="text-gray-400">Aucune donnée</span>
                  ) : (
                    cellValue.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {typeof item === "object" && item !== null
                          ? JSON.stringify(item)
                          : String(item)}
                      </span>
                    ))
                  )}
                </div>
              );
            }

            return renderResultValue(cellValue);
          },
        }));

        return (
          <div className="rounded-lg overflow-hidden">
            <DataTable
              columns={columns}
              data={processedData as Record<string, unknown>[]}
            />
          </div>
        );
      }

      // Sinon, renvoyer un tableau standard
      return renderTable(processedData);
    }

    // Si aucun des cas ci-dessus, renvoyer la valeur telle quelle
    return renderResultValue(data);
  };

  // Préparer les données pour les onglets
  const getTabsData = (deliverable: Deliverable) => {
    if (!deliverable || !deliverable.short_result || !deliverable.long_result) {
      return {
        tabs: ["Analyse complète", "Résumé"],
        contents: [null, null],
      };
    }

    logger.debug("long_result:", deliverable.long_result);
    logger.debug("short_result:", deliverable.short_result);

    return {
      tabs: ["Analyse complète", "Résumé"],
      contents: [
        deliverable.long_result.result,
        deliverable.short_result.result,
      ],
    };
  };

  const handleRegenerateDeliverable = async () => {
    try {
      setIsRegenerating(true); // On disable le bouton de régénération de la dialog

      const selectedIds = selectedDocuments.map((doc: UploadingFile) => doc.id);

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
          user_prompt: remarks.trim() || "",
          new: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de régénérer le livrable");
      }

      // L'API retourne maintenant un tableau de livrables
      const newDeliverables: Deliverable[] = await response.json();

      const newDeliverable: Deliverable =
        newDeliverables[newDeliverables.length - 1];

      logger.info("Our new deliverable:", newDeliverable);

      // Ajouter le nouvel ID à la fin de la liste
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

      setIsLoading(true);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      setRemarks("");
      setIsRegenerating(false);
      setIsRegenerateDialogOpen(false);
    } catch (error) {
      logger.error("Error regenerating deliverable:", error);
      setIsRegenerating(false);
      alert("Une erreur est survenue lors de la régénération du livrable");
    }
  };

  const handleVersionSelect = (index: number) => {
    setDeliverable(null);
    setIsLoading(true);
    if (index !== currentVersionIndex) {
      setCurrentVersionIndex(index);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resultRef.current) return;

    const jsPDFModule = await import("jspdf");
    const { jsPDF } = jsPDFModule as unknown as { jsPDF: any };

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth() - 20;
    let y = 10;

    const elements = resultRef.current.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, li, table, pre",
    );

    elements.forEach((el) => {
      const tag = el.tagName.toLowerCase();
      let fontSize = 11;
      let fontStyle: "normal" | "bold" = "normal";
      let text = el.textContent?.trim() || "";

      if (/^h[1-6]$/.test(tag)) {
        const level = parseInt(tag.charAt(1), 10);
        const sizes = [18, 16, 14, 13, 12, 11];
        fontSize = sizes[level - 1] || 11;
        fontStyle = "bold";
      } else if (tag === "li") {
        text = `\u2022 ${text}`;
      }

      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, fontStyle);

      const lines = pdf.splitTextToSize(text, pageWidth);

      lines.forEach((line: string) => {
        if (y > pdf.internal.pageSize.getHeight() - 10) {
          pdf.addPage();
          y = 10;
        }
        pdf.text(line, 10, y);
        y += fontSize * 0.6;
      });
      y += fontSize * 0.4;
    });

    pdf.save("deliverable-result.pdf");
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
              {/* Status badge */}
              {isLoading && !deliverable ? (
                <Skeleton className="h-6 w-48 rounded-full" />
              ) : (
                <>
                  {deliverable && deliverable.status === "COMPLETED" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 transition-opacity duration-300 ease-in-out">
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
                      en {Math.floor(deliverable.process_duration_in_seconds / 60)}:{String(Math.floor(deliverable.process_duration_in_seconds % 60)).padStart(2, '0')}m
                    </span>
                  )}
                  {deliverable && deliverable.status === "ERROR" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800 transition-opacity duration-300 ease-in-out">
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
                      deliverable.status === "PROGRESS") && (
                      <ProgressBadge createdAt={new Date(deliverable.createdAt)} size="medium" />
                    )}
                </>
              )}

              {/* Version dropdown */}
              {isLoading && !deliverable ? (
                <Skeleton className="h-8 w-20 rounded-md" />
              ) : (
                deliverableIds && deliverableIds.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 transition-all duration-200"
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
                )
              )}

              {/* Regenerate button */}
              <Button
                size="sm"
                variant="outline"
                className="gap-1 transition-all duration-200"
                onClick={() => setIsRegenerateDialogOpen(true)}
                disabled={isLoading || deliverable?.status !== "COMPLETED"}
              >
                <RefreshCw className="h-4 w-4" />
                Régénérer
              </Button>
            </div>
          </div>

          <div className="flex-grow flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
            {isLoading ? (
              <div className="flex flex-col space-y-4 py-4 flex-grow animate-fadeIn transition-opacity duration-300">
                <Skeleton className="h-full w-full" />
              </div>
            ) : error ? (
              <div className="py-6 text-center text-red-500 flex-grow animate-fadeIn transition-opacity duration-300">
                <p>{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 transition-all duration-200"
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
              <div className="flex-grow flex flex-col overflow-hidden animate-fadeIn transition-opacity duration-300">
                <div className="flex-grow overflow-hidden">
                  {!isLoading && deliverable.long_result && (
                    <ScrollArea className="h-full w-full" ref={resultRef}>
                      {renderResultValue(deliverable.long_result.result)}
                    </ScrollArea>
                  )}
                </div>
              </div>
            ) : deliverable && deliverable.status === "ERROR" ? (
              <div className="py-6 text-center text-red-500 flex-grow animate-fadeIn transition-opacity duration-300">
                <p>Une erreur est survenue lors de la génération du livrable</p>
                <Button
                  variant="outline"
                  className="mt-4 transition-all duration-200"
                  onClick={() => setIsRegenerateDialogOpen(true)}
                >
                  Essayer de régénérer
                </Button>
              </div>
            ) : (
              <div className="py-6 text-center text-gray-500 flex-grow animate-fadeIn transition-opacity duration-300">
                <p>Aucun résultat disponible</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              className="transition-all duration-200"
            >
              Télécharger le PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-all duration-200"
            >
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
