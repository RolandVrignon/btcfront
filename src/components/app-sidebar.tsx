"use client";

import { useState } from "react";
import { History, MoreVertical, Pencil, Trash2, X, Check } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/src/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Input } from "@/src/components/ui/input";

// Types pour les projets
type ProjectStatus = "en_cours" | "terminé" | "erreur";

interface Project {
  id: string;
  name: string;
  date: string;
  status: ProjectStatus;
}

// Fonction pour obtenir la couleur selon le statut
function getStatusColor(status: ProjectStatus): string {
  switch (status) {
    case "en_cours":
      return "bg-yellow-400";
    case "terminé":
      return "bg-green-500";
    case "erreur":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

// Exemple de projets récents mockés
const initialProjects: Project[] = [
  {
    id: "0000000000000001",
    name: "Résidence Les Oliviers",
    date: "2023-11-15",
    status: "en_cours",
  },
  {
    id: "0000000000000002",
    name: "Tour Horizon",
    date: "2023-10-22",
    status: "terminé",
  },
  {
    id: "0000000000000003",
    name: "Centre Commercial Atlantis avec un nom très long qui devrait être tronqué",
    date: "2023-09-05",
    status: "erreur",
  },
  {
    id: "0000000000000004",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000005",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000006",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000007",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000008",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000009",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000010",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000011",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000012",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000013",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000014",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000015",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
  {
    id: "0000000000000016",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "terminé",
  },
];

export function AppSidebar() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState<string>("");

  const handleRename = (id: string) => {
    const projectToRename = projects.find((project) => project.id === id);
    if (projectToRename) {
      setNewName(projectToRename.name);
      setEditingId(id);
    }
  };

  const handleSaveRename = () => {
    if (editingId && newName.trim()) {
      setProjects(
        projects.map((project) =>
          project.id === editingId
            ? { ...project, name: newName.trim() }
            : project,
        ),
      );
      setEditingId(null);
    }
  };

  const handleCancelRename = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setProjects(projects.filter((project) => project.id !== id));
  };

  return (
    <div className="top-0 left-0 h-screen">
      <div className="relative h-full">
        <Sidebar className="flex flex-col h-full">
          <SidebarContent className="flex flex-col flex-1 overflow-hidden">
            <SidebarGroup className="flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between pr-2">
                <SidebarGroupLabel className="flex-shrink-0">
                  Historique des projets
                </SidebarGroupLabel>
              </div>
              <SidebarGroupContent className="flex-1 overflow-y-auto scrollbar-hide">
                <SidebarMenu>
                  {projects.length > 0 ? (
                    projects.map((project) => (
                      <SidebarMenuItem key={project.id}>
                        <SidebarMenuButton asChild>
                          <div className="flex items-center w-full">
                            {editingId === project.id ? (
                              <div className="flex items-center flex-1 min-w-0 mr-2 space-x-2">
                                <div
                                  className={`h-3 w-3 flex-shrink-0 rounded-full ${getStatusColor(project.status)}`}
                                  aria-hidden="true"
                                />
                                <Input
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  className="h-7 py-1 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveRename();
                                    if (e.key === "Escape")
                                      handleCancelRename();
                                  }}
                                />
                                <button
                                  onClick={handleSaveRename}
                                  className="p-1 rounded-full hover:bg-sidebar-accent focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                                >
                                  <Check className="h-4 w-4" />
                                  <span className="sr-only">Enregistrer</span>
                                </button>
                                <button
                                  onClick={handleCancelRename}
                                  className="p-1 rounded-full hover:bg-sidebar-accent focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Annuler</span>
                                </button>
                              </div>
                            ) : (
                              <>
                                <div
                                  className={`h-3 w-3 flex-shrink-0 rounded-full ${getStatusColor(project.status)}`}
                                  aria-hidden="true"
                                />
                                <span className="ml-2 truncate">
                                  {project.name}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="ml-auto p-1 rounded-full hover:bg-sidebar-accent focus:outline-none focus:ring-1 focus:ring-sidebar-ring"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">
                                        Options pour {project.name}
                                      </span>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleRename(project.id)}
                                    >
                                      <Pencil className="mr-2 h-4 w-4" />
                                      <span>Renommer</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleDelete(project.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      <span>Supprimer</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sidebar-foreground/70 text-sm">
                      <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Aucun projet récent</p>
                      <p className="mt-1 text-xs">
                        Les projets consultés apparaîtront ici
                      </p>
                    </div>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </div>
    </div>
  );
}
