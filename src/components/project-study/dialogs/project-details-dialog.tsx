"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Project, PublicDocument } from "@/src/types/project";
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
import { ExternalLink } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";

interface ProjectDetailsDialogProps {
  project: Project | null;
}

export function ProjectDetailsDialog({ project }: ProjectDetailsDialogProps) {
  const [tabIndex, setTabIndex] = useState(0);

  if (!project) return null;

  const tabs = ["Description du projet", "Documents publiques"];

  const handleOpenDocument = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <span id="details-dialog-trigger" className="hidden" />
      </DialogTrigger>
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {project.name || "Détails du projet"}
          </DialogTitle>
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
                    <p className="text-muted-foreground italic">
                      Aucun document public disponible pour ce projet.
                    </p>
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
