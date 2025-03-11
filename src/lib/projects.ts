import { Project } from "@/src/types/project";

// Exemple de projets mockés
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Résidence Les Oliviers",
    date: "2023-11-15",
    status: "COMPLETED",
  },
  { id: "2", name: "Tour Horizon", date: "2023-10-22", status: "COMPLETED" },
  {
    id: "3",
    name: "Centre Commercial Atlantis",
    date: "2023-09-05",
    status: "COMPLETED",
  },
  {
    id: "4",
    name: "Hôpital Saint-Michel",
    date: "2023-08-18",
    status: "COMPLETED",
  },
];

export async function getProjectById(id: string): Promise<Project | null> {
  // Simuler un appel API
  return new Promise((resolve) => {
    setTimeout(() => {
      const project = mockProjects.find((p) => p.id === id);
      resolve(project || null);
    }, 100);
  });
}

export async function getAllProjects(): Promise<Project[]> {
  // Simuler un appel API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockProjects]);
    }, 100);
  });
}
