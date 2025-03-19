"use client";

import * as React from "react";
import { ExternalLink, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Project } from "@/src/types/project";
import { Skeleton } from "../../ui/skeleton";
import { GoogleMapsIcon } from "@/src/components/ui/google-maps-icon";

interface ProjectMapDialogProps {
  project: Project;
}

export function ProjectMapDialog({ project }: ProjectMapDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [mapUrl, setMapUrl] = React.useState("");
  const [hasError, setHasError] = React.useState(false);
  const [errorDetails, setErrorDetails] = React.useState<string | null>(null);
  const [apiKey, setApiKey] = React.useState<string | null>(null);
  const [isApiKeyLoading, setIsApiKeyLoading] = React.useState(false);

  // Construire l'adresse complète pour Google Maps
  const getFullAddress = () => {
    const parts = [];
    if (project.ai_address) parts.push(project.ai_address);
    if (project.ai_zip_code) parts.push(project.ai_zip_code);
    if (project.ai_city) parts.push(project.ai_city);
    if (project.ai_country) parts.push(project.ai_country);

    return parts.join(", ");
  };

  // URL pour ouvrir directement dans Google Maps (fonctionne sans clé API)
  const getDirectMapUrl = () => {
    const address = getFullAddress();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  // Récupérer la clé API depuis le serveur
  const fetchApiKey = async () => {
    try {
      setIsApiKeyLoading(true);
      const response = await fetch("/api/config");

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log(
        "Clé API récupérée depuis le serveur:",
        !!data.googleMapsApiKey,
      );

      return data.googleMapsApiKey;
    } catch (error) {
      console.error("Erreur lors de la récupération de la clé API:", error);
      return null;
    } finally {
      setIsApiKeyLoading(false);
    }
  };

  // Générer l'URL de l'iframe avec la clé API
  const generateMapUrl = (key: string) => {
    const address = getFullAddress();
    return `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encodeURIComponent(address)}`;
  };

  // Gérer l'ouverture et la fermeture de la boîte de dialogue
  const handleOpenChange = async (open: boolean) => {
    if (open) {
      setIsLoading(true);
      setHasError(false);
      setErrorDetails(null);

      // Récupérer la clé API si elle n'est pas déjà chargée
      if (!apiKey) {
        const key = await fetchApiKey();
        setApiKey(key);

        if (!key) {
          setHasError(true);
          setErrorDetails(
            "Impossible de récupérer la clé API Google Maps depuis le serveur.",
          );
          setIsLoading(false);
        } else {
          const url = generateMapUrl(key);
          setMapUrl(url);
        }
      } else {
        // Utiliser la clé API déjà chargée
        const url = generateMapUrl(apiKey);
        setMapUrl(url);
      }
    }
    setIsOpen(open);
  };

  // Gérer le chargement de l'iframe
  const handleIframeLoad = () => {
    console.log("Iframe chargée avec succès");
    setIsLoading(false);
  };

  // Gérer les erreurs de l'iframe
  const handleIframeError = () => {
    console.error("Erreur de chargement de l'iframe");
    setIsLoading(false);
    setHasError(true);

    // Déterminer le type d'erreur en fonction du protocole
    if (window.location.protocol === "https:") {
      setErrorDetails(
        `Erreur de chargement en HTTPS. Vérifiez que votre domaine ${window.location.origin} est autorisé dans les restrictions de la clé API.`,
      );
    } else {
      setErrorDetails(
        "Erreur d'accès. Vérifiez les restrictions de votre clé API.",
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          id="map-dialog-trigger"
          variant="outline"
          size="icon"
          className="hidden"
        >
          <GoogleMapsIcon size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh] p-6 overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <span>Localisation du projet</span>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => window.open(getDirectMapUrl(), "_blank")}
            >
              <ExternalLink size={14} />
              Ouvrir dans Google Maps
            </Button>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Localisation du projet {project.name || "Localisation du projet"}
          </DialogDescription>
        </DialogHeader>
        <div className="w-full h-[calc(90vh-100px)] min-h-[450px] rounded-md overflow-hidden relative mt-0">
          {(isLoading || isApiKeyLoading) && (
            <div className="absolute inset-0 z-10">
              <Skeleton className="w-full h-full" />
            </div>
          )}

          {hasError ? (
            <div className="flex flex-col items-center justify-center h-full bg-gray-100 text-gray-500 p-4">
              <AlertTriangle size={48} className="text-amber-500 mb-4" />
              <h3 className="text-xl font-medium mb-2">
                Impossible de charger la carte
              </h3>
              {errorDetails && (
                <p className="mb-4 text-center text-sm">{errorDetails}</p>
              )}
              <div className="space-y-4 w-full max-w-md">
                <div className="bg-amber-50 p-4 rounded-md text-sm border border-amber-200">
                  <p className="font-medium text-amber-800 mb-1">
                    Configuration de la clé API
                  </p>
                  <ol className="list-decimal pl-4 text-amber-700 space-y-1">
                    <li>Vérifiez que l&apos;API Maps Embed est activée</li>
                    <li>
                      Ajoutez votre domaine complet avec protocole (
                      {window.location.origin}*) aux domaines autorisés
                    </li>
                    <li>
                      Assurez-vous que la facturation est configurée si
                      nécessaire
                    </li>
                  </ol>
                </div>
                <Button
                  onClick={() => window.open(getDirectMapUrl(), "_blank")}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <GoogleMapsIcon size={16} />
                  Voir sur Google Maps
                </Button>
              </div>
            </div>
          ) : (
            !isApiKeyLoading &&
            mapUrl && (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={mapUrl}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="absolute inset-0"
              />
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
