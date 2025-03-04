"use client";

import { useState } from "react";
import {
  File,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";
import { DocumentMetadataDialog } from "@/components/document-metadata-dialog";
import { UploadingFile } from "@/types/project";
interface FileUploadListProps {
  files: UploadingFile[];
  projectId?: string;
}

export function FileUploadList({ files, projectId }: FileUploadListProps) {
  const [selectedFile, setSelectedFile] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    } else if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".png")) {
      return <ImageIcon className="h-5 w-5 text-purple-500" />;
    }
    return <File className="h-5 w-5 text-blue-500" />;
  };

  // Fonction pour ouvrir la popup de métadonnées
  const handleFileClick = (documentId: string) => {
    const uploadingFile = files.find((f) => f.id === documentId);
    if (!uploadingFile || !projectId) return;

    setSelectedFile({
      id: documentId,
      name: uploadingFile.fileName,
    });
    setIsDialogOpen(true);
  };

  // Fonction pour obtenir l'URL de visualisation et ouvrir le fichier
  const openFileInNewTab = async () => {
    console.log('openFileInNewTab:')

    console.log('selectedFile:', selectedFile)
    console.log('projectId:', projectId)

    if (!selectedFile || !projectId) return;

    try {
      // Appel à notre API interne pour obtenir l'URL de visualisation
      const response = await fetch("/api/documents/view", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          projectId: projectId,
        }),
      });

      console.log('response:', response)

      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération de l'URL de visualisation",
        );
      }

      const data = await response.json();
      console.log('data:', data)

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("URL de visualisation non disponible");
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture du fichier:", error);
      alert("Impossible d'ouvrir le fichier. Veuillez réessayer plus tard.");
    }
  };

  return (
    <>
      <div className="w-full">
        <h3 className="text-xl font-semibold mb-4">
          Fichiers ({files.length})
        </h3>
        <div className="border rounded-lg flex flex-col min-h-[30vh] max-h-[30vh] overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-2 border-b hover:bg-gray-100 cursor-pointer transition-colors group"
              onClick={() => handleFileClick(file.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-shrink-0 max-w-[80%] items-center gap-2">
                  <div className="text-muted-foreground">
                    {getFileIcon(file.fileName ?? "")}
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <p className="font-medium truncate">{file.fileName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {file.status?.toLowerCase() === "upload" ? (
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                      Upload
                    </div>
                  ) : file.status?.toLowerCase() === "pending" ? (
                    <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                      En attente
                    </div>
                  ) : file.status?.toLowerCase() === "processing" ? (
                    <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                      Traitement
                    </div>
                  ) : file.status?.toLowerCase() === "indexing" ? (
                    <div className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                      Indexation
                    </div>
                  ) : file.status?.toLowerCase() === "ready" ? (
                    <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Prêt
                    </div>
                  ) : file.status?.toLowerCase() === "error" ? (
                    <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">
                      Erreur
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                      {file.status}
                    </div>
                  )}
                </div>
              </div>

              {/* Barre de progression pour l'upload */}
              {file.status === "upload" && (
                <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedFile && projectId && (
        <DocumentMetadataDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          fileName={selectedFile.name}
          projectId={projectId}
          onOpenDocument={openFileInNewTab}
          fileStatus={files.find((f) => f.id === selectedFile.id)?.status}
        />
      )}
    </>
  );
}
