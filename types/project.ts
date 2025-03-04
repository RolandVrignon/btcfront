export type ProjectStatus = "en_cours" | "terminé" | "erreur";

export interface Project {
  id: string;
  name?: string;
  date?: string;
  status?: ProjectStatus;
  externalId?: string;
}


export interface UploadingFile {
  file?: File;
  fileName?: string;
  id: string;
  progress?: number;
  status?:
    | "upload"
    | "processing"
    | "pending"
    | "indexing"
    | "rafting"
    | "ready"
    | "end"
    | "error";
  url?: string; // URL S3 où le fichier a été uploadé
}