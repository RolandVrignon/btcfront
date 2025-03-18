"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/src/lib/utils";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Project, UploadingFile } from "@/src/types/project";
import { LogOut, Plus, FileText } from "lucide-react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { motion } from "framer-motion";

interface SidebarProps {
  projectRef: React.MutableRefObject<Project | null>;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  setUploadingFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>;
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  className?: string;
  projects: Project[];
  isLoading: boolean;
}

// Variantes d'animation pour la sidebar
const sidebarVariants = {
  expanded: {
    width: "300px", // Largeur fixe quand ouverte
  },
  collapsed: {
    width: "80px", // Largeur fixe quand fermée
  },
};

// Variantes d'animation pour les éléments de texte
const itemVariants = {
  expanded: {
    opacity: 1,
    display: "block",
    transition: { duration: 0.2 },
  },
  collapsed: {
    opacity: 0,
    display: "none",
    transition: {
      opacity: { duration: 0.1 },
      display: { delay: 0.2 },
    },
  },
};

// Variantes d'animation pour les icônes
const iconVariants = {
  expanded: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  collapsed: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// Variantes d'animation pour les overlays
const overlayVariants = {
  expanded: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
  collapsed: {
    opacity: 1,
    transition: { duration: 0.2, delay: 0.1 },
  },
};

// Composant réutilisable pour le texte avec effet de marquee
function MarqueeText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  // Vérifier si le texte est tronqué et nécessite un marquee
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (textRef.current && isHovered) {
      const element = textRef.current;
      const isTextOverflowing = element.scrollWidth > element.clientWidth;

      if (isTextOverflowing) {
        // Ajouter un délai avant d'activer le marquee
        timeoutId = setTimeout(() => {
          setShouldMarquee(true);
        }, 500); // Délai de 500ms
      }
    } else {
      setShouldMarquee(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isHovered]);

  // Créer le contenu répété pour l'effet de boucle
  const content = shouldMarquee ? (
    <>
      {children}
      <span className="mx-4">•</span>
      {children}
      <span className="mx-4">•</span>
      {children}
    </>
  ) : (
    children
  );

  return (
    <motion.div
      className="marquee-container flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={itemVariants}
    >
      <span
        ref={textRef}
        className={cn(
          "inline-block w-full transition-all duration-200 leading-none flex items-center",
          shouldMarquee
            ? "animate-marquee"
            : "truncate group-hover:translate-x-1 pt-1",
          className,
        )}
      >
        {content}
      </span>
    </motion.div>
  );
}

export function Sidebar({
  projectRef,
  setProject,
  setUploadingFiles,
  setSelectedFiles,
  className,
  projects,
  isLoading,
  setIsUploading,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.reload();
    router.push("/auth/signin");
  };

  const handleNewProject = () => {
    if (!projectRef) return;
    projectRef.current = null;
    setProject(null);
    setUploadingFiles([]);
    setSelectedFiles([]);
    setIsUploading(false);
  };

  return (
    <div className="relative h-full">
      <motion.div
        className={cn(
          "flex flex-col h-full bg-background z-10 overflow-hidden",
          className,
        )}
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
        variants={sidebarVariants}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex flex-col justify-between h-full space-y-1 py-4">
          {/* Nouveau projet */}
          <div className="px-2 py-2">
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center h-10 gap-2 px-2 py-2 rounded-md bg-stone-900 text-white hover:bg-stone-800 rounded-3xl transition-colors group relative"
                onClick={handleNewProject}
              >
                <motion.div
                  className="w-6 h-6 flex items-center rounded-3xl justify-center flex-shrink-0"
                  variants={iconVariants}
                >
                  <Plus className="h-5 w-5" />
                </motion.div>
                <div className="text-md whitespace-nowrap">Nouveau projet</div>
                {/* Overlay pour centrer l'icône quand la sidebar est fermée */}
                <motion.div
                  className="absolute inset-0 flex items-center rounded-3xl justify-center bg-stone-900 pointer-events-none"
                  variants={overlayVariants}
                >
                  <Plus className="h-5 w-5" />
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Liste des projets */}
          <div className="flex flex-col flex-1 px-2 py-4 mb-4">
            <div className="flex items-center px-2 h-8">
              <motion.h2
                className="text-lg font-semibold mb-4 tracking-tight"
                variants={itemVariants}
              >
                Historique
              </motion.h2>
            </div>
            <div className="space-y-1 flex-1">
              {isLoading ? (
                <ScrollArea className="h-[100%]">
                  <div className="flex flex-col h-[300px] gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg"
                      >
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : projects.length > 0 ? (
                <ScrollArea className="h-[100%]">
                  <div className="flex flex-col h-[300px] gap-2">
                    {projects.map((project) => (
                      <SidebarProjectItem
                        key={project.id}
                        project={project}
                        isActive={
                          pathname === `/dashboard/project/${project.id}`
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="px-2 py-2 text-md text-muted-foreground h-10 flex items-center">
                  <motion.span variants={itemVariants}>
                    Aucun projet trouvé
                  </motion.span>
                </div>
              )}
            </div>
          </div>

          {/* Déconnexion */}
          <div className="px-2 py-4 border-t mt-auto">
            <div
              className="flex items-center h-10 gap-2 px-2 py-2 rounded-md bg-stone-300 text-stone-900 hover:text-white hover:bg-stone-800 rounded-3xl transition-colors cursor-pointer group relative"
              onClick={handleSignOut}
            >
              <motion.div
                className="w-6 h-6 flex items-center rounded-3xl justify-center flex-shrink-0"
                variants={iconVariants}
              >
                <LogOut className="h-5 w-5" />
              </motion.div>
              <motion.div
                className="text-md whitespace-nowrap"
                variants={itemVariants}
              >
                Déconnexion
              </motion.div>
              {/* Overlay pour centrer l'icône quand la sidebar est fermée */}
              <motion.div
                className="absolute inset-0 flex items-center rounded-3xl justify-center bg-stone-300 pointer-events-none"
                variants={overlayVariants}
              >
                <LogOut className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface SidebarProjectItemProps {
  project: Project;
  isActive: boolean;
}

function SidebarProjectItem({ project, isActive }: SidebarProjectItemProps) {
  return (
    <Link
      href={`/dashboard/project/${project.externalId}`}
      className={cn(
        "flex items-center h-10 gap-2 py-2 px-2 rounded-md text-md transition-colors group relative",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
      )}
    >
      <motion.div
        className="w-6 h-6 flex items-center justify-center flex-shrink-0"
        variants={iconVariants}
      >
        <FileText className="h-5 w-5 flex-shrink-0" />
      </motion.div>
      <MarqueeText>{project.name || "Sans nom"}</MarqueeText>
      {/* Overlay pour centrer l'icône quand la sidebar est fermée */}
      <motion.div
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-md pointer-events-none",
          isActive ? "bg-accent" : "bg-transparent",
        )}
        variants={overlayVariants}
      >
        <FileText className="h-5 w-5" />
      </motion.div>
    </Link>
  );
}
