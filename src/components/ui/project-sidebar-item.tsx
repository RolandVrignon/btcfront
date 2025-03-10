"use client";

import * as React from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Project } from "@/src/types/project";

interface ProjectSidebarItemProps {
  project: Project;
  isActive: boolean;
}

export function ProjectSidebarItem({ project, isActive }: ProjectSidebarItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  // Calculer la durée de l'animation en fonction de la longueur du nom du projet
  const animationDuration = `${Math.max((project.name?.length || 10) * 0.2, 5)}s`;

  return (
    <Link
      href={`/dashboard/project/${project.id}`}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors relative",
        isActive
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50 hover:text-accent-foreground",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <FileText className="h-4 w-4 flex-shrink-0" />

      {/* Conteneur avec largeur fixe et débordement caché */}
      <div className="w-[calc(100%-24px)] relative overflow-hidden">
        {/* Texte statique avec troncature */}
        <div
          className={cn(
            "truncate transition-opacity duration-200",
            isHovered ? "opacity-0" : "opacity-100"
          )}
        >
          {project.name || "Sans nom"}
        </div>

        {/* Texte animé qui apparaît au survol */}
        <div
          className={cn(
            "absolute top-0 left-0 w-full whitespace-nowrap transition-opacity duration-200",
            isHovered ? "opacity-100 animate-marquee-scroll" : "opacity-0"
          )}
          style={{
            animationDuration: animationDuration
          }}
        >
          {project.name || "Sans nom"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {project.name || "Sans nom"}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {project.name || "Sans nom"}
        </div>
      </div>
    </Link>
  );
}