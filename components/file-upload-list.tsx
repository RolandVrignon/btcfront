"use client"

import { useState } from "react"
import { File, FileText, Image as ImageIcon, FileSpreadsheet, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface FileUploadListProps {
  files: {
    file: File
    id: string
    progress: number
    status: 'processing' | 'pending' | 'indexing' | 'rafting' | 'ready' | 'end'
    url?: string
    documentId?: string
    processingStatus?: string
    processingMessage?: string
  }[]
  projectId?: string
}

export function FileUploadList({ files, projectId }: FileUploadListProps) {
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null)

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <File className="h-5 w-5 text-red-500" />
    } else if (file.type === 'text/csv') {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <FileText className="h-5 w-5 text-blue-600" />
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-purple-500" />
    }
    return <File className="h-5 w-5 text-blue-500" />
  }

  // Fonction pour obtenir l'URL de visualisation et ouvrir le fichier
  const openFileInNewTab = async (fileId: string) => {
    const uploadingFile = files.find(f => f.id === fileId)
    if (!uploadingFile || !projectId) return

    setLoadingFileId(fileId)
    try {
      // Appel à notre API interne pour obtenir l'URL de visualisation
      const response = await fetch('/api/documents/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: uploadingFile.file.name,
          projectId: projectId
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération de l'URL de visualisation");
      }

      const data = await response.json();

      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error("URL de visualisation non disponible");
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture du fichier:", error);
      alert("Impossible d'ouvrir le fichier. Veuillez réessayer plus tard.");
    } finally {
      setLoadingFileId(null);
    }
  }

  // Fonction pour obtenir le libellé du statut de traitement
  const getProcessingStatusLabel = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'En attente'
      case 'INDEXING':
        return 'Indexation'
      case 'RAFTING':
        return 'Condensation'
      case 'PROCESSING':
        return 'Traitement'
      case 'READY':
        return 'Prêt'
      case 'END':
        return 'Erreur'
      default:
        return status
    }
  }

  // Fonction pour obtenir la classe CSS du badge selon le statut
  const getProcessingStatusClass = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return "bg-gray-50 text-gray-700"
      case 'INDEXING':
        return "bg-blue-50 text-blue-700"
      case 'RAFTING':
        return "bg-purple-50 text-purple-700"
      case 'PROCESSING':
        return "bg-yellow-50 text-yellow-700"
      case 'READY':
        return "bg-green-50 text-green-700"
      case 'END':
        return "bg-red-50 text-red-700"
      default:
        return "bg-gray-50 text-gray-700"
    }
  }

  return (
    <div className="w-full">
      <h3 className="text-xl font-semibold mb-4">Fichiers ({files.length})</h3>
      <div className="border rounded-lg flex flex-col gap-1 min-h-[20vh] max-h-[20vh] overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-2 border-b hover:bg-gray-100 cursor-pointer transition-colors group"
            onClick={() => openFileInNewTab(file.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-shrink-0 max-w-[80%] items-center gap-2">
                {getFileIcon(file.file)}
                <span className="font-medium truncate">{file.file.name}</span>
                <div className="text-xs text-gray-500 mt-1 truncate">{formatFileSize(file.file.size)}</div>
                <ExternalLink
                  className="h-3 w-3 text-gray-400 opacity-100 transition-opacity"
                  aria-label="Ouvrir dans un nouvel onglet"
                />
              </div>
              <div className="flex items-center gap-2">
                {file.processingStatus && (
                  <Badge
                    variant="outline"
                    className={getProcessingStatusClass(file.processingStatus)}
                  >
                    {getProcessingStatusLabel(file.processingStatus)}
                  </Badge>
                )}
                {loadingFileId === file.id && (
                  <span className="text-xs text-gray-500 animate-pulse">Chargement...</span>
                )}
              </div>
            </div>

            {file.status === 'pending' && (
              <Progress value={file.progress} className="h-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}