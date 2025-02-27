"use client"

import { useState } from "react"
import { File, AlertCircle, ExternalLink, FileText, Image as ImageIcon, FileSpreadsheet } from "lucide-react"
import { UploadingFile } from "./project-tools"
import Image from "next/image"
import { usePresignedUrl } from "@/lib/hooks/use-presigned-url"

interface FileUploadListProps {
  files: UploadingFile[]
  projectId?: string
}

export function FileUploadList({ files, projectId }: FileUploadListProps) {
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null)
  const { getPresignedUrl } = usePresignedUrl()

  // Fonction pour obtenir l'aperçu du fichier
  const getFilePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return URL.createObjectURL(file)
    }
    return null
  }

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (file: File) => {
    if (file.type === 'application/pdf') {
      return <File className="w-6 h-6 text-red-500" />
    } else if (file.type === 'text/csv') {
      return <FileSpreadsheet className="w-6 h-6 text-green-600" />
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return <FileText className="w-6 h-6 text-blue-600" />
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6 text-purple-500" />
    }
    return <File className="w-6 h-6 text-muted-foreground" />
  }

  // Fonction pour obtenir l'URL présignée du S3 et ouvrir le fichier
  const openFileInNewTab = async (fileId: string) => {
    const uploadingFile = files.find(f => f.id === fileId)
    if (!uploadingFile) return

    setLoadingFileId(fileId)
    try {
      const presignedUrl = await getPresignedUrl(uploadingFile.file, projectId)

      if (presignedUrl) {
        window.open(presignedUrl.url, '_blank')
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'URL présignée", error)
      alert("Impossible d'ouvrir le fichier. Veuillez réessayer plus tard.")
    } finally {
      setLoadingFileId(null)
    }
  }

  return (
    <div className="w-full border rounded-[20px]">
      <div className="p-2 bg-muted/30 border-b top-0 z-10">
        <h3 className="font-medium">Fichiers téléchargés ({files.length})</h3>
      </div>

      <div className="divide-y max-h-[30vh] overflow-y-auto">
        {files.map((uploadingFile) => (
          <div
            key={uploadingFile.id}
            className={`p-3 flex justify-start items-center gap-3 ${uploadingFile.status === 'completed' ? 'cursor-pointer hover:bg-muted/80 transition-colors' : ''}`}
            onClick={() => uploadingFile.status === 'completed' && openFileInNewTab(uploadingFile.id)}
          >
            <div className="h-6 w-6 flex-shrink-0 rounded overflow-hidden bg-muted/30 flex items-center justify-center">
              {getFilePreview(uploadingFile.file) ? (
                <Image
                  src={getFilePreview(uploadingFile.file)!}
                  alt={uploadingFile.file.name}
                  width={48}
                  height={48}
                  className="object-cover h-full w-full"
                />
              ) : (
                getFileIcon(uploadingFile.file)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <span className="truncate font-medium text-sm mr-2">
                  {uploadingFile.file.name}
                </span>
                {loadingFileId === uploadingFile.id && (
                  <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                )}
                {uploadingFile.status === 'completed' && !loadingFileId && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {uploadingFile.status === 'uploading' ? (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 bg-primary rounded-full"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                  <div className="flex-shrink-0 w-9 text-xs font-medium">
                    {uploadingFile.progress}%
                  </div>
                </div>
              ) : uploadingFile.status === 'error' && (
                <div className="mt-2 flex items-center text-red-500 text-xs">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Erreur lors du téléchargement
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}