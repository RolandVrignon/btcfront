"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Deliverable, Project } from "@/src/types/type";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  AnimatedTabs,
  AnimatedTabsContent,
} from "@/src/components/ui/animated-tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { AlertTriangle, ExternalLink, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { logger } from "@/src/utils/logger";
// import { monitorDeliverable } from "@/src/components/project-study/utils/utils";
// Modify the Localisation component to accept a showGeorisquesButton prop
interface LocalisationProps {
  project: Project;
  onOpenGeorisques: () => void;
  showGeorisquesButton?: boolean;
}

function Localisation({
  project,
  onOpenGeorisques,
  showGeorisquesButton = true,
}: LocalisationProps) {
  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-lg flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Localisation
        </CardTitle>
        <CardDescription>
          Il s&apos;agit d&apos;une adresse trouvée à proximité du projet. Cette
          adresse est utilisée pour trouver les informations ci-dessous.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Adresse : </span>
            {project.closest_formatted_address || "Non disponible"}
          </p>
          <p>
            <span className="font-medium">Coordonnées GPS : </span>
            {project.latitude}, {project.longitude}
          </p>
          <p>
            <span className="font-medium">Altitude : </span>
            {Math.round(project.altitude || 0)} m
          </p>

          {showGeorisquesButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenGeorisques}
              className="mt-2"
            >
              Consulter sur Géorisques{" "}
              <ExternalLink className="h-3.5 w-3.5 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectDetailsDialogProps {
  project: Project | null;
}

export function ProjectDetailsDialog({ project }: ProjectDetailsDialogProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [publicDocuments, setPublicDocuments] = useState<Deliverable | null>(
    null,
  );
  const [georisquesData, setGeorisquesData] = useState<Deliverable | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch deliverables when dialog opens
  useEffect(() => {
    if (open && project) {
      fetchDeliverables();
    }
    //eslint-disable-next-line
  }, [open, project]);

  // Reset tab index when dialog closes
  useEffect(() => {
    if (!open) {
      setTabIndex(0);
    }
    if (project) {
      logger.info("project", project);
    }
    //eslint-disable-next-line
  }, [open]);

  useEffect(() => {
    logger.info("publicDocuments", publicDocuments);
  }, [publicDocuments]);

  useEffect(() => {
    logger.info("georisquesData", georisquesData);
  }, [georisquesData]);

  const fetchDeliverables = async () => {
    if (!project) return;

    setIsLoading(true);
    try {
      // Exécuter les deux requêtes en parallèle

      logger.info(
        "Fetching deliverables documents and georisques for project",
        project.externalId,
      );

      const [documentsResponse, georisquesResponse] = await Promise.all([
        fetch("/api/deliverables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project.externalId,
            type: "DOCUMENTS_PUBLIQUES",
            documentIds: [],
            user_prompt: "",
            new: false,
          }),
        }),
        fetch("/api/deliverables", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            projectId: project.externalId,
            type: "GEORISQUES",
            documentIds: [],
            user_prompt: "",
            new: false,
          }),
        }),
      ]);

      logger.info("documentsResponse", documentsResponse);
      logger.info("georisquesResponse", georisquesResponse);

      // Traiter les résultats en parallèle également
      await Promise.all([
        (async () => {
          if (documentsResponse.ok) {
            const documentsData = await documentsResponse.json();
            if (documentsData) {
              const lastDeliverable = documentsData[documentsData.length - 1];
              logger.info("DocumentslastDeliverable", lastDeliverable);
              const res = await fetch(
                `/api/deliverables/${lastDeliverable.id}`,
              );
              const deliverableData = await res.json();
              setPublicDocuments(deliverableData);
            }
          }
        })(),
        (async () => {
          if (georisquesResponse.ok) {
            const georisquesData = await georisquesResponse.json();
            if (georisquesData) {
              const lastDeliverable = georisquesData[georisquesData.length - 1];
              logger.info("Georisques lastDeliverable", lastDeliverable);
              const res = await fetch(
                `/api/deliverables/${lastDeliverable.id}`,
              );
              const deliverableData = await res.json();
              setGeorisquesData(deliverableData);
            }
          }
        })(),
      ]);
    } catch (error) {
      logger.error("Error fetching deliverables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!project) return null;

  const tabs = ["Documents publics", "Géorisques"];

  const handleOpenDocument = (url: string) => {
    window.open(url, "_blank");
  };

  const handleOpenGeorisques = () => {
    const shortResult = georisquesData?.short_result as unknown as {
      risquesNaturels?: Record<string, { present: boolean; libelle: string }>;
      risquesTechnologiques?: Record<
        string,
        { present: boolean; libelle: string }
      >;
      url?: string;
    };
    if (shortResult?.url) {
      window.open(shortResult.url, "_blank");
    }
  };

  // Helper function to render risque items
  const renderRisqueItem = (
    risque: { present: boolean; libelle: string },
    key: string,
  ) => (
    <div
      key={key}
      className={`flex items-center p-2 rounded-md ${risque.present ? "bg-amber-50 border border-amber-200" : "bg-gray-50 border border-gray-200"}`}
    >
      {risque.present && (
        <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
      )}
      <span
        className={risque.present ? "font-medium" : "text-muted-foreground"}
      >
        {risque.libelle}
      </span>
    </div>
  );

  // Cast short_result pour l'utiliser dans le rendu
  const shortResult = georisquesData?.short_result as unknown as {
    risquesNaturels?: Record<string, { present: boolean; libelle: string }>;
    risquesTechnologiques?: Record<
      string,
      { present: boolean; libelle: string }
    >;
    url?: string;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <span
          id="details-dialog-trigger"
          className="hidden"
          onClick={() => setOpen(true)}
        />
      </DialogTrigger>
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {project.name || "Détails du projet"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Détails du projet {project.name || "Détails du projet"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col overflow-hidden mt-4">
          <AnimatedTabs
            tabs={tabs}
            defaultIndex={0}
            onChange={setTabIndex}
            className="mb-4 flex-shrink-0"
          />

          <div className="flex-grow overflow-hidden">
            <AnimatedTabsContent value={tabIndex} index={0} className="h-full">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="pr-4">
                  <Localisation
                    project={project}
                    onOpenGeorisques={() => {}}
                    showGeorisquesButton={false}
                  />

                  <div className="mt-6">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-28 w-28 animate-spin text-muted-foreground" />
                      </div>
                    ) : publicDocuments?.short_result &&
                      Object.keys(publicDocuments.short_result).length > 0 ? (
                      <div className="rounded-lg overflow-hidden border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Lien</TableHead>
                              <TableHead className="w-[100px] text-right">
                                Action
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(publicDocuments.short_result).map(
                              ([key, value]) => {
                                const doc = value as { lien: string };
                                return (
                                  <TableRow
                                    key={key}
                                    className="cursor-pointer hover:bg-muted/80"
                                    onClick={() => handleOpenDocument(doc.lien)}
                                  >
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className="font-normal"
                                      >
                                        {key}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="truncate max-w-[400px]">
                                      {doc.lien}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0 ml-auto"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDocument(doc.lien);
                                              }}
                                            >
                                              <ExternalLink className="h-4 w-4" />
                                              <span className="sr-only">
                                                Ouvrir
                                              </span>
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Ouvrir le document</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </TableCell>
                                  </TableRow>
                                );
                              },
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <div className="bg-muted rounded-full p-3 mb-4">
                          <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-center max-w-md">
                          Aucun document public disponible pour ce projet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </AnimatedTabsContent>

            <AnimatedTabsContent value={tabIndex} index={1} className="h-full">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="pr-4 space-y-6">
                  <Localisation
                    project={project}
                    onOpenGeorisques={handleOpenGeorisques}
                    showGeorisquesButton={
                      georisquesData?.short_result &&
                      (
                        georisquesData.short_result as unknown as {
                          url?: string;
                        }
                      ).url
                        ? true
                        : false
                    }
                  />
                  {georisquesData?.status !== "COMPLETED" &&
                  georisquesData?.status !== "ERROR" ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : georisquesData?.status === "COMPLETED" &&
                    georisquesData?.short_result ? (
                    <div className="space-y-6 pb-8">
                      {/* Risques Naturels */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">
                            Risques Naturels
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {shortResult.risquesNaturels &&
                              Object.entries(shortResult.risquesNaturels).map(
                                ([key, risque]) =>
                                  renderRisqueItem(risque, `naturel-${key}`),
                              )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Risques Technologiques */}
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">
                            Risques Technologiques
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {shortResult.risquesTechnologiques &&
                              Object.entries(
                                shortResult.risquesTechnologiques,
                              ).map(([key, risque]) =>
                                renderRisqueItem(risque, `techno-${key}`),
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12">
                      <div className="bg-muted rounded-full p-3 mb-4">
                        <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground text-center max-w-md">
                        Aucune information de géorisques disponible pour ce
                        projet.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </AnimatedTabsContent>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
