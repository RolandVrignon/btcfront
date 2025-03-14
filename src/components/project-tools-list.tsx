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
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { DeliverableResultDialog } from "@/src/components/deliverable-result-dialog";

interface Deliverable {
  id: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";
}

interface Tool {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  endpoint?: string;
  isLoading?: boolean;
}

interface ProjectToolsListProps {
  projectId?: string;
}

export function ProjectToolsList({ projectId }: ProjectToolsListProps) {
  const [tools, setTools] = useState<Tool[]>([
    {
      id: "descriptif",
      name: "Descriptif sommaire des travaux",
      type: "DESCRIPTIF_SOMMAIRE_DES_TRAVAUX",
      description:
        "Obtenir un descriptif sommaire des travaux décrits dans le/les CCTP, en vue de rédiger le RICT.",
      icon: <FileText className="h-12 w-12" />,
      color: "bg-blue-100 text-blue-700",
      endpoint: "/tools/descriptif",
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
    },
    {
      id: "incoherences",
      name: "Incohérences",
      type: "INCOHERENCE_DE_DONNEES",
      description: "Détection des incohérences dans le projet.",
      icon: <AlertTriangle className="h-12 w-12" />,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: "suggestions",
      name: "Suggestions",
      type: "SUGGESTIONS",
      description: "Propositions d'améliorations pour votre projet.",
      icon: <Lightbulb className="h-12 w-12" />,
      color: "bg-purple-100 text-purple-700",
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<{
    id: string;
    toolName: string;
  } | null>(null);

  const monitorDeliverable = async (
    deliverableId: string,
    toolId: string,
    toolName: string,
  ) => {
    try {
      let isComplete = false;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals

      console.log("Waiting for 5 seconds...");

      await new Promise((resolve) => setTimeout(resolve, 5000));

      console.log("5 seconds passed...");
      console.log("We'll start monitoring the deliverable...");

      while (!isComplete && attempts < maxAttempts) {
        attempts++;

        console.log("Checking if deliverable is completed...");
        console.log(
          "/api/deliverables/${deliverableId}",
          `/api/deliverables/${deliverableId}`,
        );

        const response = await fetch(`/api/deliverables/${deliverableId}`);

        if (!response.ok) {
          throw new Error("Failed to monitor deliverable");
        }

        const deliverable: Deliverable = await response.json();
        console.log("AAAAAAAAAAAAHHHHHHHHHHH deliverable:", deliverable);

        console.log("deliverable.status:", deliverable.status);

        if (
          deliverable.status === "COMPLETED" ||
          deliverable.status === "ERROR"
        ) {
          isComplete = true;

          setTools((prevTools) =>
            prevTools.map((tool) =>
              tool.id === toolId ? { ...tool, isLoading: false } : tool,
            ),
          );

          if (deliverable.status === "COMPLETED") {
            setSelectedDeliverable({
              id: deliverableId,
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

        console.log(
          "IS NOT COMPLETED, waiting 5 seconds before checking again...",
        );

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

        toast.error(
          "La génération du livrable prend plus de temps que prévu. Veuillez réessayer plus tard.",
        );
      }
    } catch (error) {
      console.error("Error monitoring deliverable:", error);

      setTools((prevTools) =>
        prevTools.map((tool) =>
          tool.id === toolId ? { ...tool, isLoading: false } : tool,
        ),
      );

      toast.error("Une erreur est survenue lors du suivi du livrable.");
    }
  };

  const handleToolClick = async (tool: Tool) => {
    console.log("handleToolClick:", tool);

    if (!tool.endpoint) {
      console.log(`Outil ${tool.id} bientôt disponible`);
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

    console.log("projectId:", projectId);

    try {
      // Set the tool to loading state
      setTools((prevTools) =>
        prevTools.map((t) =>
          t.id === tool.id ? { ...t, isLoading: true } : t,
        ),
      );

      // Call our API to get or create a deliverable
      const response = await fetch(
        `/api/deliverables/project?projectId=${projectId}&type=${tool.type}`,
      );

      if (!response.ok) {
        throw new Error("Failed to get or create deliverable");
      }

      const deliverable: Deliverable = await response.json();

      console.log("deliverable:", deliverable);

      if (deliverable.status === "COMPLETED") {
        setSelectedDeliverable({
          id: deliverable.id,
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

      console.log("GO to monitorDeliverable !");

      monitorDeliverable(deliverable.id, tool.id, tool.name);
    } catch (error) {
      console.error("Error handling tool click:", error);

      // Reset loading state
      setTools((prevTools) =>
        prevTools.map((t) =>
          t.id === tool.id ? { ...t, isLoading: false } : t,
        ),
      );

      toast.error("Une erreur est survenue lors de la préparation de l'outil.");
    }
  };

  return (
    <div className="mt-4">
      <Toaster position="top-right" />
      <h3 className="text-xl font-semibold mb-4">Outils disponibles</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`rounded-xl p-4 pt-8 cursor-pointer min-h-[25vh] transition-all hover:shadow-md ${tool.color} border border-transparent ${tool.endpoint && !tool.isLoading ? "hover:border-current" : "opacity-70"} relative`}
            onClick={() => handleToolClick(tool)}
          >
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
                ) : tool.endpoint ? (
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
            {tool.endpoint && !tool.isLoading && (
              <div className="absolute bottom-4 right-4">
                <ArrowRight className="h-5 w-5 opacity-70" />
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedDeliverable && (
        <DeliverableResultDialog
          deliverableId={selectedDeliverable.id}
          toolName={selectedDeliverable.toolName}
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </div>
  );
}
