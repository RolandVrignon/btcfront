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
import { Project, PublicDocument } from "@/src/types/type";
import { RenderMarkdown } from "@/src/components/ui/render-markdown";
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
import { AlertTriangle, ExternalLink, MapPin } from "lucide-react";
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

// Modify the Localisation component to accept a showGeorisquesButton prop
interface LocalisationProps {
  project: Project;
  onOpenGeorisques: () => void;
  showGeorisquesButton?: boolean;
}

function Localisation({
  project,
  onOpenGeorisques,
  showGeorisquesButton = true
}: LocalisationProps) {
  return (
    <Card>
      <CardHeader className="pb-6">
        <CardTitle className="text-lg flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Localisation
        </CardTitle>
        <CardDescription>
          Il s&apos;agit de l&apos;adresse officielle trouvée à proximité du
          projet et utilisée pour trouver ces informations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Adresse : </span>
            {project.publicData?.adresse?.libelle || "Non disponible"}
          </p>
          <p>
            <span className="font-medium">Commune : </span>
            {project.publicData?.commune?.libelle || "Non disponible"}
            {project.publicData?.commune?.codePostal
              ? ` (${project.publicData.commune.codePostal})`
              : ""}
          </p>
          <p>
            <span className="font-medium">Coordonnées GPS : </span>
            {project.latitude}, {project.longitude}
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

  // Reset tab index when dialog closes
  useEffect(() => {
    if (!open) {
      setTabIndex(0);
    }
    if (project) {
      logger.info("project", project);
    }
  }, [open]);

  if (!project) return null;

  const tabs = ["Description du projet", "Documents publiques", "Géorisques"];

  const handleOpenDocument = (url: string) => {
    window.open(url, "_blank");
  };

  const handleOpenGeorisques = () => {
    if (project.publicData?.url) {
      window.open(project.publicData.url, "_blank");
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
                  {project.long_summary ? (
                    <RenderMarkdown
                      content={project.long_summary}
                      className="prose-p:my-4 prose-li:my-1 prose-headings:mt-6 prose-headings:mb-4"
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      Aucune description disponible pour ce projet.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </AnimatedTabsContent>

            <AnimatedTabsContent value={tabIndex} index={1} className="h-full">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="pr-4">
                  <Localisation
                    project={project}
                    onOpenGeorisques={handleOpenGeorisques}
                    showGeorisquesButton={false}
                  />

                  <div className="mt-6">
                    {project.documents && project.documents.length > 0 ? (
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
                            {project.documents.map(
                              (doc: PublicDocument, index: number) => (
                                <TableRow
                                  key={index}
                                  className="cursor-pointer hover:bg-muted/80"
                                  onClick={() => handleOpenDocument(doc.lien)}
                                >
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className="font-normal"
                                    >
                                      {doc.type}
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
                              ),
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
                          Aucune document publique disponible pour ce projet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </AnimatedTabsContent>

            <AnimatedTabsContent value={tabIndex} index={2} className="h-full">
              <ScrollArea className="h-[calc(90vh-180px)]">
                <div className="pr-4 space-y-6">
                  <Localisation
                    project={project}
                    onOpenGeorisques={handleOpenGeorisques}
                    showGeorisquesButton={true}
                  />
                  {project.publicData ? (
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
                            {Object.entries(
                              project.publicData?.risquesNaturels || {},
                            ).map(([key, risque]) =>
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
                            {Object.entries(
                              project.publicData?.risquesTechnologiques || {},
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
