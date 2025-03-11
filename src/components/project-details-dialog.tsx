"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Project } from "@/src/types/project";
import Markdown from "react-markdown";

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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {project.name || "Détails du projet"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 prose prose-blue max-w-none">
          <Markdown>{project.long_summary}</Markdown>
        </div>
      </DialogContent>
    </Dialog>
  );
}
