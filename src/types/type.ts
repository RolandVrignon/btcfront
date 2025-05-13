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

// Optional: Define more specific types for GPS coordinates
export type Latitude = number; // Range: -90 to 90
export type Longitude = number; // Range: -180 to 180

export interface Project {
  id?: string;
  externalId?: string;
  name?: string;
  status?: ProjectStatus;
  // Location properties
  latitude?: number;
  longitude?: number;
  ai_address?: string;
  closest_formatted_address?: string;
  // Summary properties
  short_summary?: string;
  long_summary?: string;
  // Other properties
  ai_city?: string;
  ai_zip_code?: string;
  ai_country?: string;
  date?: string;
  userId?: string;
  deliverables?: Deliverable[];
  altitude?: number;
}

export interface UploadingFile {
  file?: File;
  fileName: string;
  id: string;
  progress?: number;
  url?: string;
  status?: Status;
  indexation_status?: Status;
  processingMessage?: string;
  tags?: string[];
}

export enum DeliverableType {
  DOCUMENTS_PUBLIQUES = "DOCUMENTS_PUBLIQUES",
  GEORISQUES = "GEORISQUES",
  DESCRIPTIF_SOMMAIRE_DES_TRAVAUX = "DESCRIPTIF_SOMMAIRE_DES_TRAVAUX",
  TABLEAU_DES_DOCUMENTS_EXAMINES = "TABLEAU_DES_DOCUMENTS_EXAMINES",
  COMPARATEUR_INDICES = "COMPARATEUR_INDICES",
  ANALYSE_ETHUDE_THERMIQUE = "ANALYSE_ETHUDE_THERMIQUE",
  INCOHERENCE_DE_DONNEES = "INCOHERENCE_DE_DONNEES",
}
export interface Deliverable {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: DeliverableType;
  status: Status;
  projectId: string;
  short_result?: undefined;
  long_result?: undefined;
}

export type FieldOrderObject = {
  __data: unknown;
  __fieldOrder: string[];
  __isArray: boolean;
};
