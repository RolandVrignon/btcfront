export type ProjectStatus =
  | "DRAFT"
  | "PENDING"
  | "PROGRESS"
  | "COMPLETED"
  | "ERROR";

export type Status =
  | "UPLOAD"
  | "DRAFT"
  | "PENDING"
  | "PROGRESS"
  | "COMPLETED"
  | "ERROR";

export interface PublicDocument {
  type: string;
  lien: string;
}

export type PublicDocumentList = PublicDocument[];

export interface RisqueNaturel {
  present: boolean;
  libelle: string;
}

export interface RisqueTechnologique {
  present: boolean;
  libelle: string;
}

export interface PublicData {
  adresse: {
    libelle: string;
    longitude: number;
    latitude: number;
  };
  commune: {
    libelle: string;
    codePostal: string;
    codeInsee: string;
  };
  url: string;
  risquesNaturels: {
    inondation: RisqueNaturel;
    risqueCotier: RisqueNaturel;
    seisme: RisqueNaturel;
    mouvementTerrain: RisqueNaturel;
    reculTraitCote: RisqueNaturel;
    retraitGonflementArgile: RisqueNaturel;
    avalanche: RisqueNaturel;
    feuForet: RisqueNaturel;
    eruptionVolcanique: RisqueNaturel;
    cyclone: RisqueNaturel;
    radon: RisqueNaturel;
  };
  risquesTechnologiques: {
    icpe: RisqueTechnologique;
    nucleaire: RisqueTechnologique;
    canalisationsMatieresDangereuses: RisqueTechnologique;
    pollutionSols: RisqueTechnologique;
    ruptureBarrage: RisqueTechnologique;
    risqueMinier: RisqueTechnologique;
  };
}

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
  documents?: PublicDocumentList;
  publicData?: PublicData;
}

export interface UploadingFile {
  file?: File;
  fileName?: string;
  id: string;
  progress?: number;
  url?: string;
  status?: Status;
  indexation_status?: Status;
  processingMessage?: string;
  tags?: string[];
}
