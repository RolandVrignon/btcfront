"use client";

import {
  FileText,
  GitCompare,
  Thermometer,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Clock,
  Construction,
  Loader2,
  Table2,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeliverableResultDialog } from "@/src/components/project-study/dialogs/deliverable-result-dialog";
import { FileSelectionDialog } from "@/src/components/project-study/dialogs/select-infos-deliverable-dialog";
import { LoadingSpinner } from "../../ui/loading-spinner";
import { UploadingFile } from "@/src/types/type";
import { logger } from "@/src/utils/logger";
import { StatusPastille } from "@/src/components/ui/status-pastille";
import { Deliverable } from "@/src/types/type";
import { useDeliverableSocket } from "@/src/hooks/use-deliverable-socket";
import { ProgressBadge } from "@/src/components/project-study/components/ProgressBadge";

interface Tool {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  endpoint?: boolean;
  isLoading?: boolean;
}

interface ProjectToolsListProps {
  projectId?: string;
  isToolsReady?: boolean;
  uploadFiles?: UploadingFile[];
}

type DeliverableStatusInfo = {
  status: "PROGRESS" | "COMPLETED" | "ERROR" | null;
  createdAt?: Date | null;
};

export function ProjectToolsList({
  projectId,
  isToolsReady = false,
  uploadFiles,
}: ProjectToolsListProps) {
  const [tools, setTools] = useState<Tool[]>([
    {
      id: "descriptif",
      name: "Descriptif sommaire des travaux",
      type: "DESCRIPTIF_SOMMAIRE_DES_TRAVAUX",
      description:
        "Obtenir un descriptif sommaire des travaux décrits dans le/les CCTP, en vue de rédiger le RICT.",
      icon: <FileText className="h-12 w-12" />,
      color: "bg-blue-100 text-blue-700",
      endpoint: true,
    },
    {
      id: "tableau-des-documents-examinés",
      name: "Tableau des documents examinés",
      type: "TABLEAU_DES_DOCUMENTS_EXAMINES",
      description:
        "Obtenir un tableau des documents examinés avec toutes les informations importantes.",
      icon: <Table2 className="h-12 w-12" />,
      color: "bg-pink-100 text-pink-700",
      endpoint: true,
    },
    {
      id: "comparateur",
      name: "Comparateur d'indice",
      type: "COMPARATEUR_INDICES",
      description:
        "Identifier les différences tant sur le fond (ajouts, suppression, modifications) que sur la forme des deux documents.",
      icon: <GitCompare className="h-12 w-12" />,
      color: "bg-green-100 text-green-700",
    },
    {
      id: "thermique",
      name: "Analyse Etude Thermique",
      type: "ANALYSE_ETHUDE_THERMIQUE",
      description: "Analyse de la conformité de l'étude thermique.",
      icon: <Thermometer className="h-12 w-12" />,
      color: "bg-red-100 text-red-700",
      endpoint: false,
    },
    {
      id: "incoherences",
      name: "Incohérences",
      type: "INCOHERENCE_DE_DONNEES",
      description: "Détection des incohérences dans le projet.",
      icon: <AlertTriangle className="h-12 w-12" />,
      color: "bg-amber-100 text-amber-700",
      endpoint: false,
    },
    {
      id: "suggestions",
      name: "Suggestions",
      type: "SUGGESTIONS",
      description: "Propositions d'améliorations pour votre projet.",
      icon: <Lightbulb className="h-12 w-12" />,
      color: "bg-purple-100 text-purple-700",
      endpoint: false,
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [fileSelectionDialogOpen, setFileSelectionDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<{
    id: string[];
    toolName: string;
  } | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<UploadingFile[]>(
    [],
  );
  const [remarks, setRemarks] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [deliverableStatus, setDeliverableStatus] = useState<
    Record<string, DeliverableStatusInfo>
  >({});

  useEffect(() => {
    if (uploadFiles && uploadFiles.length > 0) {
      setSelectedDocuments(uploadFiles);
    }
  }, [uploadFiles, fileSelectionDialogOpen]);

  // Listen to deliverable updates via socket and update status in real time
  useDeliverableSocket(projectId || "", async (data) => {
    try {
      const response = await fetch(`/api/deliverables/${data.id}`);
      if (!response.ok) return;
      const deliverable: Deliverable = await response.json();

      // Find the corresponding tool by deliverable type
      const tool = tools.find((t) => t.type === deliverable.type);
      if (!tool) return;

      // Update the status for this tool
      const allowedStatus = ["PROGRESS", "COMPLETED", "ERROR"] as const;
      setDeliverableStatus((prev) => ({
        ...prev,
        [tool.id]: allowedStatus.includes(deliverable.status as any)
          ? {
              status: deliverable.status as "PROGRESS" | "COMPLETED" | "ERROR",
              createdAt: deliverable.createdAt
                ? new Date(deliverable.createdAt)
                : null,
            }
          : { status: null, createdAt: null },
      }));
    } catch (error) {
      logger.error("Error updating status via socket:", error);
    }
  });

  useEffect(() => {
    // On mount, fetch all deliverables for the project and update status for each tool type
    async function fetchAllDeliverables() {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/deliverables/project/${projectId}`);
        if (!res.ok) return;
        const deliverables = await res.json();
        if (!Array.isArray(deliverables)) return;
        // For each tool, find the last deliverable of its type
        const statusUpdates: Record<string, DeliverableStatusInfo> = {};
        tools.forEach((tool) => {
          if (!tool.endpoint) return;
          const deliverablesByType = deliverables.filter(
            (d: Deliverable) => d.type === tool.type,
          );
          const deliverablesByTypeSorted = deliverablesByType.sort(
            (a: Deliverable, b: Deliverable) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          const last = deliverablesByTypeSorted[0];
          if (
            last &&
            ["PROGRESS", "COMPLETED", "ERROR"].includes(last.status)
          ) {
            statusUpdates[tool.id] = {
              status: last.status,
              createdAt: last.createdAt ? new Date(last.createdAt) : null,
            };
          } else {
            statusUpdates[tool.id] = { status: null, createdAt: null };
          }
        });
        setDeliverableStatus((prev) => ({ ...prev, ...statusUpdates }));
      } catch {
        // In case of error, set all to null
        const statusUpdates: Record<string, DeliverableStatusInfo> = {};
        tools.forEach((tool) => {
          if (tool.endpoint)
            statusUpdates[tool.id] = { status: null, createdAt: null };
        });
        setDeliverableStatus((prev) => ({ ...prev, ...statusUpdates }));
      }
    }
    fetchAllDeliverables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const monitorDeliverable = async (
    deliverableId: string,
    toolId: string,
    toolName: string,
  ) => {
    try {
      let isComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      setDeliverableStatus((prev) => ({
        ...prev,
        [toolId]: { status: "PROGRESS", createdAt: new Date() },
      }));
      await new Promise((resolve) => setTimeout(resolve, 5000));

      while (!isComplete && attempts < maxAttempts) {
        attempts++;

        const response = await fetch(`/api/deliverables/${deliverableId}`);

        if (!response.ok) {
          throw new Error("Failed to monitor deliverable");
        }

        const deliverable: Deliverable = await response.json();

        if (
          deliverable.status === "COMPLETED" ||
          deliverable.status === "ERROR"
        ) {
          isComplete = true;
          setDeliverableStatus((prev) => ({
            ...prev,
            [toolId]: {
              status: ["COMPLETED", "ERROR", "PROGRESS"].includes(
                deliverable.status,
              )
                ? (deliverable.status as any)
                : null,
              createdAt: deliverable.createdAt
                ? new Date(deliverable.createdAt)
                : null,
            },
          }));
          if (deliverable.status === "COMPLETED") {
            setSelectedDeliverable({
              id: [deliverableId],
              toolName: toolName,
            });
            setDialogOpen(true);
          } else {
            toast.error(
              "Une erreur est survenue lors de la génération du livrable.",
            );
          }
          return;
        }

        // Wait 5 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      if (!isComplete) {
        // Timeout reached
        setTools((prevTools) =>
          prevTools.map((tool) =>
            tool.id === toolId ? { ...tool, isLoading: false } : tool,
          ),
        );
        setDeliverableStatus((prev) => ({
          ...prev,
          [toolId]: { status: null, createdAt: null },
        }));
        toast.error(
          "La génération du livrable prend plus de temps que prévu. Veuillez réessayer plus tard.",
        );
      }
    } catch (error) {
      logger.error("Error monitoring deliverable:", error);
      setTools((prevTools) =>
        prevTools.map((tool) =>
          tool.id === toolId ? { ...tool, isLoading: false } : tool,
        ),
      );
      setDeliverableStatus((prev) => ({
        ...prev,
        [toolId]: { status: "ERROR", createdAt: null },
      }));
      toast.error("Une erreur est survenue lors du suivi du livrable.");
    }
  };

  const handleToolClick = async (tool: Tool) => {
    if (!tool.endpoint) {
      logger.debug(`Outil ${tool.id} bientôt disponible`);
      return; // Do nothing if the tool has no endpoint
    }

    if (tool.isLoading) {
      toast.info("Veuillez patienter pendant la génération du livrable.");
      return;
    }

    if (!projectId) {
      toast.error("Aucun projet sélectionné.");
      return;
    }

    logger.debug("projectId:", projectId);

    try {
      const response = await fetch(`/api/deliverables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: projectId,
          type: tool.type,
          documentIds: [],
          user_prompt: "",
          new_deliverable: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get or create deliverable");
      }

      const deliverables: Deliverable[] = await response.json();

      if (deliverables.length === 0) {
        setCurrentTool(tool);
        setFileSelectionDialogOpen(true);
        return;
      }

      if (deliverables[0].status === "COMPLETED") {
        setSelectedDeliverable({
          id: deliverables.map((deliverable) => deliverable.id),
          toolName: tool.name,
        });
        setDialogOpen(true);

        // Reset loading state
        setTools((prevTools) =>
          prevTools.map((t) =>
            t.id === tool.id ? { ...t, isLoading: false } : t,
          ),
        );
        return;
      }
    } catch (error) {
      logger.error("Error handling tool click:", error);

      // Reset loading state
      setTools((prevTools) =>
        prevTools.map((t) =>
          t.id === tool.id ? { ...t, isLoading: false } : t,
        ),
      );

      toast.error("Une erreur est survenue lors de la préparation de l'outil.");
    }
  };

  const handleGenerateFirstDeliverable = async () => {
    try {
      setIsRegenerating(true);

      const selectedIds = selectedDocuments?.map((doc) => doc.id);

      if (selectedIds && selectedIds.length === 0) {
        alert("Veuillez sélectionner au moins un document");
        return;
      }

      const obj = {
        projectId: projectId,
        type: currentTool?.type,
        documentIds: selectedIds,
        user_prompt: remarks.trim() || "",
        new: true,
      };

      // Appeler l'API pour régénérer le livrable
      const response = await fetch(`/api/deliverables/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(obj),
      });

      if (!response.ok) {
        throw new Error("Impossible de régénérer le livrable");
      }

      const deliverables: Deliverable[] = await response.json();

      const deliverable = deliverables[deliverables.length - 1];

      setSelectedDeliverable({
        id: [deliverable.id],
        toolName: currentTool?.name || "",
      });

      await new Promise((resolve) => setTimeout(resolve, 3000));

      setDialogOpen(true);

      await monitorDeliverable(
        deliverable.id,
        currentTool?.id || "",
        currentTool?.name || "",
      );

      setRemarks("");
      setIsRegenerating(false);
      setFileSelectionDialogOpen(false);
    } catch (error) {
      logger.error("Error regenerating deliverable:", error);
    }
  };

  return (
    <div className="mt-4 w-full">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-xl font-semibold">Outils disponibles</h3>
        {!isToolsReady && (
          <div className="flex items-center text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full whitespace-nowrap">
            <LoadingSpinner />
            Traitement des documents en cours
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`rounded-xl p-4 pt-8 ${isToolsReady ? "cursor-pointer hover:shadow-md" : "cursor-not-allowed"} min-h-[25vh] transition-all ${tool.color} border border-transparent ${tool.endpoint && !tool.isLoading && isToolsReady ? "hover:border-current" : "opacity-70"} relative`}
            onClick={() => (isToolsReady ? handleToolClick(tool) : null)}
          >
            {tool.endpoint && (
              <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
                {deliverableStatus[tool.id]?.status === "PROGRESS" && (
                  <ProgressBadge
                    createdAt={deliverableStatus[tool.id]?.createdAt}
                    size="small"
                  />
                )}
                {deliverableStatus[tool.id]?.status === "COMPLETED" && (
                  <Badge className="bg-green-100 text-green-700 px-2 py-0.5">
                    Terminé
                  </Badge>
                )}
                {deliverableStatus[tool.id]?.status === "ERROR" && (
                  <Badge className="bg-red-100 text-red-700 px-2 py-0.5">
                    Erreur
                  </Badge>
                )}
              </div>
            )}
            {!tool.endpoint && (
              <Badge
                variant="outline"
                className="absolute top-2 right-2 bg-white/50 z-10 flex items-center gap-1"
              >
                <Construction className="h-3 w-3" />
                En chantier
              </Badge>
            )}
            <div className="flex items-start gap-4">
              <div className="rounded-full p-2 bg-white/80">
                {tool.isLoading ? (
                  <Loader2 className="h-12 w-12 animate-spin" />
                ) : tool.icon ? (
                  tool.icon
                ) : (
                  <Clock className="h-12 w-12" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-medium">{tool.name}</h4>
                <p className="text-md opacity-80 mt-1 line-clamp-3">
                  {tool.description}
                </p>
              </div>
            </div>
            {tool.endpoint && !tool.isLoading && isToolsReady && (
              <div className="absolute bottom-4 right-4">
                <ArrowRight className="h-5 w-5 opacity-70" />
              </div>
            )}

            {!isToolsReady && (
              <div className="absolute inset-0 z-20 backdrop-blur-[2px] flex items-center justify-center pointer-events-auto rounded-xl overflow-hidden"></div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>

      {selectedDeliverable && (
        <DeliverableResultDialog
          projectId={projectId || ""}
          deliverableIds={selectedDeliverable.id}
          toolName={selectedDeliverable.toolName}
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          uploadFiles={uploadFiles}
          setDeliverableIds={setSelectedDeliverable}
        />
      )}

      {currentTool && fileSelectionDialogOpen && (
        <FileSelectionDialog
          isOpen={fileSelectionDialogOpen}
          onOpenChange={setFileSelectionDialogOpen}
          uploadFiles={uploadFiles || []}
          selectedFiles={selectedDocuments || []}
          setSelectedFiles={(files) => setSelectedDocuments(files)}
          onRegenerateClick={handleGenerateFirstDeliverable}
          isRegenerating={isRegenerating}
          title={`Sélection de fichiers pour ${currentTool.name}`}
          description="Veuillez sélectionner les fichiers à analyser pour cet outil."
          remarks={remarks}
          setRemarks={setRemarks}
        />
      )}
    </div>
  );
}
