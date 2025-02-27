export type ProjectStatus = "en_cours" | "terminé" | "erreur"

export interface Project {
  id: string
  name?: string
  date?: string
  status?: ProjectStatus
}