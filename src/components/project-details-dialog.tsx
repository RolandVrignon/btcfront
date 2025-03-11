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
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeSanitize from "rehype-sanitize";
import rehypeExternalLinks from "rehype-external-links";
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
          <div className="prose prose-blue max-w-none prose-p:my-4 prose-li:my-1 prose-headings:mt-6 prose-headings:mb-4 prose-table:my-4 pr-4">
            <Markdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[
                rehypeRaw,
                rehypeSlug,
                rehypeSanitize,
                [
                  rehypeExternalLinks,
                  {
                    target: "_blank",
                    rel: ["nofollow", "noopener", "noreferrer"],
                  },
                ],
              ]}
              components={{
                table: ({ ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table
                      className="border-collapse border border-slate-300"
                      {...props}
                    />
                  </div>
                ),
                th: ({ ...props }) => (
                  <th
                    className="border border-slate-300 bg-slate-100 p-2 font-semibold"
                    {...props}
                  />
                ),
                td: ({ ...props }) => (
                  <td className="border border-slate-300 p-2" {...props} />
                ),
                p: ({ ...props }) => <p className="my-4" {...props} />,
                ul: ({ ...props }) => (
                  <ul className="my-4 pl-6 list-disc" {...props} />
                ),
                ol: ({ ...props }) => (
                  <ol className="my-4 pl-6 list-decimal" {...props} />
                ),
                li: ({ ...props }) => <li className="my-1" {...props} />,
              }}
            >
              {project.long_summary}
            </Markdown>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
