"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import { UploadingFile } from "@/src/types/type";
import { Label } from "@/src/components/ui/label";
import { ChangeEvent } from "react";

interface FileSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  uploadFiles: UploadingFile[];
  selectedFiles: UploadingFile[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<UploadingFile[]>>;
  onRegenerateClick: () => void;
  isRegenerating?: boolean;
  title?: string;
  description?: string;
  remarks: string;
  setRemarks: React.Dispatch<React.SetStateAction<string>>;
}

export function FileSelectionDialog({
  isOpen,
  onOpenChange,
  uploadFiles,
  selectedFiles,
  setSelectedFiles,
  onRegenerateClick,
  isRegenerating = false,
  title = "Sélectionner les documents",
  description = "Choisissez les documents à utiliser pour la régénération du livrable.",
  remarks,
  setRemarks,
}: FileSelectionDialogProps) {
  // Fonction pour basculer la sélection d'un fichier
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev: UploadingFile[]) => {
      const isSelected = prev.some((file) => file.id === fileId);
      if (isSelected) {
        // Si le fichier est déjà sélectionné, le retirer
        return prev.filter((file) => file.id !== fileId);
      } else {
        // Sinon, l'ajouter à la sélection
        const fileToAdd = uploadFiles.find((file) => file.id === fileId);
        if (fileToAdd) {
          return [...prev, fileToAdd];
        }
        return prev;
      }
    });
  };

  // Fonction pour sélectionner/désélectionner tous les fichiers
  const toggleSelectAll = () => {
    if (selectedFiles.length === uploadFiles.length) {
      // Si tous sont sélectionnés, désélectionner tous
      setSelectedFiles([]);
    } else {
      // Sinon, sélectionner tous
      setSelectedFiles([...uploadFiles]);
    }
  };

  // Vérifier si un fichier est sélectionné
  const isFileSelected = (fileId: string) => {
    return selectedFiles.some((file) => file.id === fileId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[70vh] max-w-[70vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Section de sélection de fichiers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium">
                Documents sélectionnés ({selectedFiles.length})
              </h3>
              {uploadFiles.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="text-xs"
                  >
                    {selectedFiles.length === uploadFiles.length
                      ? "Désélectionner tout"
                      : "Sélectionner tout"}
                  </Button>
                </div>
              )}
            </div>
            <ScrollArea className="h-[200px] pr-4 border rounded-md">
              {uploadFiles.length > 0 ? (
                <div className="p-2">
                  {uploadFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                    >
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id={`file-${file.id}`}
                          checked={isFileSelected(file.id)}
                          onChange={() => toggleFileSelection(file.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                      </div>
                      <label
                        htmlFor={`file-${file.id}`}
                        className="text-sm font-medium text-gray-900 cursor-pointer flex-grow"
                      >
                        {file.fileName || `Document ${file.id}`}
                        <span className="ml-2 text-xs text-gray-500">
                          {file.tags && file.tags.length > 0
                            ? `(${file.tags[0]})`
                            : "(Document)"}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p>Aucun document disponible</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Section des remarques */}
          <div>
            <Label htmlFor="remarks" className="text-sm font-medium">
              Remarques additionnelles
            </Label>
            <textarea
              id="remarks"
              placeholder="Ajoutez vos remarques ou précisions pour la génération..."
              className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              value={remarks}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setRemarks(e.target.value)
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={onRegenerateClick}
            disabled={isRegenerating || selectedFiles.length === 0}
          >
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Chargement...
              </>
            ) : (
              "Générer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
