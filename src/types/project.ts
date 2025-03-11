export type ProjectStatus =
  | "DRAFT"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "ERROR";

export interface Project {
  id: string;
  name?: string;
  short_summary?: string;
  long_summary?: string;
  ai_address?: string;
  ai_city?: string;
  ai_zip_code?: string;
  ai_country?: string;
  date?: string;
  status?: ProjectStatus;
  externalId?: string;
  userId?: string;
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
