"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";

interface SelectedFilesListProps {
  files: File[];
  onRemove: (index: number) => void;
  onUploadAll: () => void;
  isUploading: boolean;
}

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
            if (!isUploading) {
              onUploadAll();
            }
          }}
          disabled={isUploading}
          className="ml-auto"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              Upload en cours...
            </span>
          ) : (
            "Télécharger tous les documents"
          )}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="divide-y">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-1">
              <div className="flex items-center gap-2 flex-1">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
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
