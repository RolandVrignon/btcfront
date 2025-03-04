"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { Project } from "@/src/types/project";
import { Loader2, LogOut, FileText } from "lucide-react";
import Image from "next/image";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  userId?: string;
}

export function Sidebar({ className, userId, ...props }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/user/${userId}`);

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des projets");
        }

        const data = await response.json();
        console.log("Projets récupérés:", data);
        setProjects(data);
      } catch (error) {
        console.error("Erreur lors du chargement des projets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [userId]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  return (
    <div className={cn("flex flex-col h-full", className)} {...props}>
      <div className="flex flex-col justify-between h-full space-y-1 py-4">
        <div className="flex items-center justify-center">
          <Image
            src="/assets/img/logo2.jpg"
            alt="logo"
            width={150}
            height={100}
          />
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Projets
          </h2>
          <div className="space-y-1">
            <Button
              variant="secondary"
              className="w-full justify-start"
              asChild
            >
              <Link href="/dashboard">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Nouveau projet
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col flex-1 px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Historique
          </h2>
          <div className="space-y-1 flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Chargement...
                </span>
              </div>
            ) : projects.length > 0 ? (
              <ScrollArea className="h-[100%]">
                <div className="flex flex-col h-[300px] gap-2 px-2">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/dashboard/project/${project.id}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                        pathname === `/dashboard/project/${project.id}`
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/50 hover:text-accent-foreground",
                      )}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="truncate">{project.name}</span>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                Aucun projet trouvé
              </div>
            )}
          </div>
        </div>
        <div className="px-3 py-4 border-t mt-auto">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}
