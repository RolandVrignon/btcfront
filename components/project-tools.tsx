"use client"

import Image from "next/image"
import { useState } from "react"
import { FileUploadZone } from "@/components/file-upload-zone"
import { FileUploadList } from "@/components/file-upload-list"
import { Project } from "@/types/project"
import {
  FileText,
  GitCompare,
  Thermometer,
  AlertTriangle,
  Lightbulb,
  ArrowRight
} from "lucide-react"

interface ProjectToolsProps {
  project: Project | null
}

export interface UploadingFile {
  file: File
  id: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
}

interface Tool {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

export function ProjectTools({ project }: ProjectToolsProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  const tools: Tool[] = [
    {
      id: "descriptif",
      name: "Descriptif sommaire des travaux",
      description: "Obtenir un descriptif sommaire des travaux décrits dans le/les CCTP, en vue de rédiger le RICT.",
      icon: <FileText className="h-8 w-8" />,
      color: "bg-blue-100 text-blue-700"
    },
    {
      id: "comparateur",
      name: "Comparateur d'indice",
      description: "Identifier les différences tant sur le fond (ajouts, suppression, modifications) que sur la forme des deux documents.",
      icon: <GitCompare className="h-8 w-8" />,
      color: "bg-green-100 text-green-700"
    },
    {
      id: "thermique",
      name: "Analyse Etude Thermique",
      description: "Analyse de la conformité de l'étude thermique.",
      icon: <Thermometer className="h-8 w-8" />,
      color: "bg-red-100 text-red-700"
    },
    {
      id: "incoherences",
      name: "Incohérences",
      description: "Détection des incohérences dans le projet.",
      icon: <AlertTriangle className="h-8 w-8" />,
      color: "bg-amber-100 text-amber-700"
    },
    {
      id: "suggestions",
      name: "Suggestions",
      description: "Propositions d'améliorations pour votre projet.",
      icon: <Lightbulb className="h-8 w-8" />,
      color: "bg-purple-100 text-purple-700"
    }
  ]

  const handleFilesSelected = (newFiles: File[]) => {
    // Créer des objets de fichiers en téléchargement
    const filesToUpload = newFiles.map(file => ({
      file,
      id: Math.random().toString(36).substring(2, 11),
      progress: 0,
      status: 'uploading' as const
    }))

    // Ajouter les nouveaux fichiers à la liste des fichiers en téléchargement
    setUploadingFiles(prev => [...prev, ...filesToUpload])

    // Démarrer le téléchargement pour chaque fichier
    filesToUpload.forEach(file => {
      simulateFileUpload(file.id)
    })
  }

  const simulateFileUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10

      if (progress >= 100) {
        progress = 100
        clearInterval(interval)

        setUploadingFiles(prev =>
          prev.map(f => f.id === fileId
            ? { ...f, progress: 100, status: 'completed' }
            : f
          )
        )
      } else {
        setUploadingFiles(prev =>
          prev.map(f => f.id === fileId
            ? { ...f, progress: Math.round(progress) }
            : f
          )
        )
      }
    }, 500)
  }

  const handleToolClick = (toolId: string) => {
    console.log(`Outil sélectionné: ${toolId}`)
    // Ici, vous pourriez naviguer vers une page spécifique à l'outil
    // ou ouvrir une modale, etc.
  }

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      <div className="banner h-[50vh] w-full relative flex-shrink-0">
        <Image
          src="/assets/img/bg.jpg"
          alt="Bannière d'arrière-plan"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="mt-[-35vh] pb-[80vh] inset-0 m-auto w-full px-40">
        <div className="flex flex-col w-full rounded-[30px] relative p-4 gap-4 bg-white">
          <div className="rounded-[20px] p-6 bg-black/5">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">
              {project ? project.name : "BTP Consultants IA"}
            </h1>
            <h2 className="text-xl md:text-2xl font-medium text-center">
              {project ? `Projet créé le ${new Date(project.date).toLocaleDateString('fr-FR')}` : "Votre boîte à outils pour le Contrôle Technique"}
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4">
            <FileUploadZone onFilesSelected={handleFilesSelected} />

            {uploadingFiles.length > 0 && (
              <FileUploadList files={uploadingFiles} />
            )}
          </div>

          {uploadingFiles.some(file => file.status === 'completed') && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-4">Outils disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${tool.color} border border-transparent hover:border-current`}
                    onClick={() => handleToolClick(tool.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-full p-2 bg-white/80">
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{tool.name}</h4>
                        <p className="text-sm opacity-80 mt-1">{tool.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 self-center opacity-70" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}