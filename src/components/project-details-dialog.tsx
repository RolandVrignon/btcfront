"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Project } from "@/src/types/project";
import { RenderMarkdown } from "@/src/components/ui/render-markdown";
import { ScrollArea } from "@/src/components/ui/scroll-area";

interface ProjectDetailsDialogProps {
  project: Project | null;
}

export function ProjectDetailsDialog({ project }: ProjectDetailsDialogProps) {
  if (!project || !project.long_summary) return null;

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
        <ScrollArea className="h-[calc(90vh-120px)] mt-4">
          <div className="pr-4">
            <RenderMarkdown
              content={project.long_summary}
              className="prose-p:my-4 prose-li:my-1 prose-headings:mt-6 prose-headings:mb-4"
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
