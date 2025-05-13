"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";

import {
  File,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";

// // Composant qui ne sera rendu que côté client
// const LoadingSpinner = dynamic(
//   () =>
//     Promise.resolve(() => (
//       <span className="flex items-center gap-2">
//         <div
//           className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
//           aria-hidden="true"
//         />
//         Upload en cours...
//       </span>
//     )),
//   { ssr: false },
// );

interface SelectedFilesListProps {
  files: File[];
  onRemove: (index: number) => void;
  onUploadAll: () => void;
  isUploading: boolean;
}

// Fonction pour obtenir l'icône selon le type de fichier
const getFileIcon = (fileName: string) => {
  if (fileName.endsWith(".pdf")) {
    return <File className="h-5 w-5 text-red-500" />;
  } else if (fileName.endsWith(".csv")) {
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  } else if (
    fileName.endsWith(".docx") ||
    fileName.endsWith(".doc") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".xlsx")
  ) {
    return <FileText className="h-5 w-5 text-blue-600" />;
  } else if (
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".png")
  ) {
    return <ImageIcon className="h-5 w-5 text-purple-500" />;
  }
  return <File className="h-5 w-5 text-blue-500" />;
};

export function SelectedFilesList({
  files,
  onRemove,
  onUploadAll,
  isUploading,
}: SelectedFilesListProps) {
  if (files.length === 0) return null;

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Fichiers sélectionnés</h3>
        <Button
          onClick={() => {
            onUploadAll();
          }}
          className="ml-auto"
        >
          Télécharger tous les documents
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-1">
              <div className="flex items-center gap-2">
                <div className="text-muted-foreground">
                  {getFileIcon(file.name)}
                </div>
                <span className="truncate">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(index)}
                disabled={isUploading}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
