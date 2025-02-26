"use client"

import { useState, useCallback } from "react"
import { Upload, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
}

// Types de fichiers acceptés
const ACCEPTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/pdf',
  'image/jpeg',
  'image/png'
];

// Extensions pour l'attribut accept de l'input
const ACCEPTED_FILE_EXTENSIONS = '.csv,.docx,.pdf,.jpg,.jpeg,.png';

export function FileUploadZone({ onFilesSelected }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFiles = (files: File[]): File[] => {
    setError(null)

    const validFiles = files.filter(file =>
      ACCEPTED_FILE_TYPES.includes(file.type)
    );

    if (validFiles.length < files.length) {
      setError(`Certains fichiers ont été ignorés. Formats acceptés : CSV, DOCX, PDF, JPG, PNG.`);
    }

    return validFiles;
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      const validFiles = validateFiles(newFiles)

      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }
    }
  }, [onFilesSelected])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const validFiles = validateFiles(newFiles)

      if (validFiles.length > 0) {
        onFilesSelected(validFiles)
      }

      // Réinitialiser l'input pour permettre de sélectionner à nouveau les mêmes fichiers
      e.target.value = ''
    }
  }

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={cn(
          "w-full border-2 border-dashed rounded-[20px] flex flex-col items-center justify-center p-6 transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <input
          type="file"
          className="hidden"
          id="file-upload"
          multiple
          accept={ACCEPTED_FILE_EXTENSIONS}
          onChange={handleFileInputChange}
        />
        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">Déposez vos fichiers ici</p>
        <p className="text-sm text-muted-foreground">ou cliquez pour sélectionner des fichiers</p>
        <p className="text-xs text-muted-foreground mt-2">Formats acceptés : CSV, DOCX, PDF, JPG, PNG</p>
      </label>

      {error && (
        <div className="mt-2 flex items-center text-amber-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
    </div>
  )
}