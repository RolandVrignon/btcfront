"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Project } from "@/src/types/type";
import { toast } from "sonner";
import { Input } from "@/src/components/ui/input";
import { Search } from "lucide-react";

// Add Google Maps types
declare global {
  interface Window {
    google: any;
    initializeGoogleMaps: () => void;
  }
}

interface AddressEditDialogProps {
  project: Project;
  updateProject: (updatedProject: Partial<Project>) => Promise<void>;
}

interface Location {
  lat: number;
  lng: number;
  address: string;
  altitude: number;
  city: string;
  zip_code: string;
  country: string;
}

export function AddressEditDialog({
  project,
  updateProject,
}: AddressEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const googleScriptLoadedRef = useRef(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  // Référence pour suivre si une interaction avec la suggestion est en cours
  const interactingWithSuggestion = useRef(false);

  // Style pour les suggestions d'autocomplétion
  useEffect(() => {
    // Style pour modifier le curseur sur les suggestions
    const style = document.createElement("style");
    style.textContent = `
      .pac-container {
        z-index: 10000 !important;
        position: absolute !important;
        pointer-events: auto !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        border-radius: 0.5rem !important;
        margin-top: 4px !important;
        border: 1px solid #e2e8f0 !important;
        background-color: white !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        transform: translate3d(0, 0, 0) !important;
        will-change: transform !important;
      }
      .pac-item {
        cursor: pointer !important;
        padding: 10px 12px !important;
        font-size: 14px !important;
        border-top: 1px solid #f1f5f9 !important;
      }
      .pac-item:first-child {
        border-top: none !important;
      }
      .pac-item:hover {
        background-color: #f1f9ff !important;
      }
      .pac-item-query {
        font-size: 14px !important;
        padding-right: 4px !important;
      }
      .pac-icon {
        margin-right: 10px !important;
      }
      .pac-matched {
        font-weight: bold !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Set up global initialization function
  useEffect(() => {
    window.initializeGoogleMaps = () => {
      googleScriptLoadedRef.current = true;
      if (isOpen) {
        initializeMap();
      }
    };

    return () => {
      window.initializeGoogleMaps = () => {};
    };
  }, [isOpen]);

  // Clear map references when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Reset map and marker references when dialog closes
      if (mapRef.current) {
        mapRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
      if (autocompleteRef.current) {
        autocompleteRef.current = null;
      }
    }
  }, [isOpen]);

  // Fonction pour extraire ville, code postal et pays d'une adresse
  const extractAddressComponents = (address: string): { city: string; zip_code: string; country: string } => {
    const components = {
      city: "",
      zip_code: "",
      country: "",
    };

    try {
      // Diviser l'adresse par virgules
      const addressParts = address.split(",");

      // Vérifier si nous avons au moins 2 parties (généralement la dernière partie est le pays)
      if (addressParts.length >= 2) {
        // La dernière partie est généralement le pays
        components.country = addressParts[addressParts.length - 1].trim();

        // L'avant-dernière partie contient souvent le code postal et la ville (ex: "75001 Paris")
        const cityPart = addressParts[addressParts.length - 2].trim();
        const zipCityMatch = cityPart.match(/(\d{5})\s+(.+)/);

        if (zipCityMatch) {
          components.zip_code = zipCityMatch[1];
          components.city = zipCityMatch[2];
        } else {
          // Si nous ne pouvons pas extraire le code postal, considérons que c'est juste une ville
          components.city = cityPart;
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'extraction des composants d'adresse:", error);
    }

    return components;
  };

  // Handle dialog open/close
  useEffect(() => {
    if (isOpen) {
      setIsMapLoading(true);

      // Reset search query and selected location to current project data
      if (project.closest_formatted_address) {
        setSearchQuery(project.closest_formatted_address);
      } else {
        setSearchQuery("");
      }

      // Reset selected location based on project data
      if (project.latitude && project.longitude) {
        // Extraire les composants d'adresse
        const { city, zip_code, country } = extractAddressComponents(project.closest_formatted_address || "");

        setSelectedLocation({
          lat: project.latitude,
          lng: project.longitude,
          address: project.closest_formatted_address || "",
          altitude: project.altitude || 0,
          city: project.ai_city || city,
          zip_code: project.ai_zip_code || zip_code,
          country: project.ai_country || country,
        });
      } else {
        setSelectedLocation(null);
      }

      // Always try to initialize the map when opening
      if (googleScriptLoadedRef.current) {
        // Force map initialization even if we already had the script loaded
        setTimeout(() => {
          initializeMap();
        }, 100);
      } else {
        // Otherwise load the script
        loadGoogleMapsScript();
      }
    }
  }, [isOpen, project]);

  // Load Google Maps script
  const loadGoogleMapsScript = () => {
    // Remove any existing script to avoid duplicates
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initializeGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = (error) => {
      console.error("Erreur lors du chargement du script Google Maps:", error);
      setIsMapLoading(false);
      toast.error("Impossible de charger Google Maps");
    };

    document.head.appendChild(script);
  };

  // Initialize map once script is loaded
  const initializeMap = () => {
    try {
      if (!mapContainerRef.current) return;

      // Clear any existing map instance to avoid conflicts
      if (mapRef.current) {
        // Release previous map resources
        mapRef.current = null;
      }

      // Default to project location or Paris if no location
      const initialPosition = {
        lat: project.latitude || 48.8566,
        lng: project.longitude || 2.3522,
      };

      console.log("Initializing map with position:", initialPosition);

      // Create map
      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: initialPosition,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
      mapRef.current = map;

      // Create marker
      const marker = new window.google.maps.Marker({
        position: initialPosition,
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      });
      markerRef.current = marker;

      // Set initial selected location from project data
      if (project.latitude && project.longitude) {
        setSelectedLocation({
          lat: project.latitude,
          lng: project.longitude,
          address: project.closest_formatted_address || "",
          altitude: project.altitude || 0,
          city: project.ai_city || "",
          zip_code: project.ai_zip_code || "",
          country: project.ai_country || "",
        });
      }

      // Add click event to map - capture coordinates when clicking on the map
      const clickListener = map.addListener("click", (e) => {
        if (!e.latLng) return;
        console.log("Map clicked at:", e.latLng.lat(), e.latLng.lng());

        // Update marker position
        marker.setPosition(e.latLng);

        // Get address from coordinates
        getAddressFromCoordinates(e.latLng.lat(), e.latLng.lng());
      });

      // Add dragend event to marker - capture coordinates when marker is dragged
      const dragListener = marker.addListener("dragend", () => {
        const position = marker.getPosition();
        if (!position) return;
        console.log("Marker dragged to:", position.lat(), position.lng());

        // Get address from coordinates
        getAddressFromCoordinates(position.lat(), position.lng());
      });

      // Keep track of listeners for cleanup
      const listeners = { clickListener, dragListener };

      // Initialize autocomplete after a slight delay
      setTimeout(() => {
        initializeAutocomplete();
      }, 100);

      setIsMapLoading(false);

      return listeners;
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la carte:", error);
      setIsMapLoading(false);
      toast.error("Erreur lors de l'initialisation de la carte");
      return null;
    }
  };

  // Initialize autocomplete search
  const initializeAutocomplete = () => {
    try {
      if (
        !searchBoxRef.current ||
        !window.google ||
        !window.google.maps ||
        !window.google.maps.places
      ) {
        console.error("API Places non disponible");
        return;
      }

      // Get the input element directly from searchBoxRef
      const inputElement = searchBoxRef.current.querySelector("input");
      if (!inputElement) {
        console.error("Champ de recherche non trouvé");
        return;
      }

      // Create autocomplete with options
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputElement,
        {
          types: ["address"],
          fields: ["formatted_address", "geometry", "place_id", "name"],
        },
      );

      // Important: add these options
      const checkPacContainer = () => {
        const pacContainer = document.querySelector(".pac-container");
        if (pacContainer) {
          // Make sure the pac-container doesn't close prematurely
          pacContainer.setAttribute("data-tap-disabled", "true");

          // S'assurer que le conteneur de suggestions est au-dessus de tout
          (pacContainer as HTMLElement).style.zIndex = "10000";

          // Ajouter un gestionnaire d'événements pour tous les éléments pac-item
          const pacItems = pacContainer.querySelectorAll(".pac-item");
          pacItems.forEach((item) => {
            (item as HTMLElement).addEventListener("mousedown", (e) => {
              e.preventDefault();
              e.stopPropagation();
              interactingWithSuggestion.current = true;
              console.log(
                "Suggestion sélectionnée, empêche fermeture de la dialog",
              );
            });

            (item as HTMLElement).addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Clic sur suggestion");

              // Sélectionner l'adresse manuellement
              const mainText =
                item.querySelector(".pac-item-query")?.textContent || "";
              const secondaryText =
                item.querySelector(".pac-secondary-text")?.textContent || "";
              const address =
                mainText + (secondaryText ? ", " + secondaryText : "");

              // Simuler une saisie dans l'input pour forcer la sélection
              inputElement.value = address;
              inputElement.focus();

              // Lancer une recherche géocodage pour obtenir les coordonnées
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ address }, (results, status) => {
                if (status === "OK" && results && results.length > 0) {
                  const location = results[0].geometry.location;

                  // Mise à jour manuelle de la carte et des informations
                  if (mapRef.current && markerRef.current) {
                    mapRef.current.setCenter(location);
                    mapRef.current.setZoom(17);
                    markerRef.current.setPosition(location);
                  }

                  const lat = location.lat();
                  const lng = location.lng();
                  const newLocation = {
                    lat,
                    lng,
                    address,
                  };

                  setSelectedLocation(newLocation);
                  setSearchQuery(address);
                }

                // Reset l'état après traitement
                setTimeout(() => {
                  interactingWithSuggestion.current = false;
                }, 500);
              });
            });
          });
        }
      };

      // Observer pour les ajouts de pac-container
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes.length) {
            checkPacContainer();
          }
        });
      });

      // Observer tout le document pour les changements
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // Vérifier immédiatement si le pac-container existe déjà
      checkPacContainer();

      // Prevent form submission on Enter key
      inputElement.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          // Force place_changed event
          if (autocompleteRef.current) {
            try {
              const place = autocompleteRef.current.getPlace();
              if (place && place.geometry) {
                updatePlaceOnMap(place);
              }
            } catch (err) {
              console.error("Erreur lors de la récupération du lieu:", err);
            }
          }
        }
      });

      // Handle place selection
      autocompleteRef.current.addListener("place_changed", () => {
        if (autocompleteRef.current) {
          try {
            const place = autocompleteRef.current.getPlace();
            updatePlaceOnMap(place);
          } catch (err) {
            console.error("Erreur lors de la récupération du lieu:", err);
          }
        }
      });

      return () => {
        // Cleanup
        observer.disconnect();
      };
    } catch (error) {
      console.error(
        "Erreur lors de l'initialisation de l'autocomplétion:",
        error,
      );
    }
  };

  // Nouvelle fonction pour récupérer l'altitude
  const getElevationForLocation = async (
    lat: number,
    lng: number,
  ): Promise<number | null> => {
    try {
      if (!window.google || !window.google.maps) {
        console.error("API Google Maps non disponible");
        return null;
      }

      console.log("Récupération de l'altitude pour:", lat, lng);

      const elevator = new window.google.maps.ElevationService();
      const location = { lat, lng };

      return new Promise((resolve, reject) => {
        elevator.getElevationForLocations(
          {
            locations: [location],
          },
          (results, status) => {
            if (status === "OK" && results && results.length > 0) {
              const elevation = results[0].elevation;
              console.log("Altitude récupérée:", elevation);
              resolve(elevation);
            } else {
              console.error("Impossible de récupérer l'altitude:", status);
              resolve(null);
            }
          },
        );
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'altitude:", error);
      return null;
    }
  };

  // Modifier getAddressFromCoordinates pour inclure les composants d'adresse
  const getAddressFromCoordinates = async (lat: number, lng: number) => {
    console.log("Getting address for coordinates:", lat, lng);
    try {
      setIsLoading(true);

      const geocoder = new window.google.maps.Geocoder();
      const response = await new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results && results.length > 0) {
            resolve(results);
          } else {
            reject(status);
          }
        });
      });

      // Récupérer l'altitude
      const elevation = await getElevationForLocation(lat, lng);

      const results = response as any[];
      if (results && results.length > 0) {
        const address = results[0].formatted_address;

        // Extraire les composants d'adresse
        const { city, zip_code, country } = extractAddressComponents(address);

        const newLocation = {
          lat,
          lng,
          address,
          altitude: elevation || 0,
          city,
          zip_code,
          country,
        };
        setSelectedLocation(newLocation);
        setSearchQuery(address);

        console.log("Coordonnées -> Adresse avec composants:", newLocation);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'adresse:", error);
      toast.error("Impossible de récupérer l'adresse pour ces coordonnées");

      // Récupérer l'altitude même en cas d'échec de l'adresse
      const elevation = await getElevationForLocation(lat, lng);

      // Still update coordinates even if address lookup fails
      const newLocation = {
        lat,
        lng,
        address: "Adresse non trouvée",
        altitude: elevation || 0,
        city: "",
        zip_code: "",
        country: "",
      };
      setSelectedLocation(newLocation);
      setSearchQuery("Adresse non trouvée");
    } finally {
      setIsLoading(false);
    }
  };

  // Modifier updatePlaceOnMap pour inclure les composants d'adresse
  const updatePlaceOnMap = (place: any) => {
    if (!place || !place.geometry || !place.geometry.location) {
      toast.error("Aucune information de localisation pour cette adresse");
      return;
    }

    // Get lat/lng from place
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    console.log(
      "Mise à jour de la carte avec:",
      lat,
      lng,
      place.formatted_address,
    );

    // Update map and marker
    if (mapRef.current && markerRef.current) {
      const latLng = new window.google.maps.LatLng(lat, lng);
      mapRef.current.setCenter(latLng);
      mapRef.current.setZoom(17);
      markerRef.current.setPosition(latLng);
    }

    // Récupérer l'altitude
    getElevationForLocation(lat, lng).then((elevation) => {
      const address = place.formatted_address || place.name || "";

      // Extraire les composants d'adresse
      const { city, zip_code, country } = extractAddressComponents(address);

      // Update selected location state
      const newLocation = {
        lat,
        lng,
        address,
        altitude: elevation || 0,
        city,
        zip_code,
        country,
      };

      setSelectedLocation(newLocation);
      setSearchQuery(address);

      console.log("Adresse sélectionnée avec composants:", newLocation);
    });
  };

  // Modifier handleSave pour inclure les composants d'adresse
  const handleSave = async () => {
    if (!selectedLocation) return;

    try {
      setIsLoading(true);

      // Construction des données d'adresse à partir de la sélection
      const addressData = {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        closest_formatted_address: selectedLocation.address,
        altitude: selectedLocation.altitude,
        city: selectedLocation.city,
        zip_code: selectedLocation.zip_code,
        country: selectedLocation.country,
      };

      // Appel à l'API Next.js pour mettre à jour l'adresse dans le backend
      await fetch(`/api/projects/${project.externalId}/address`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addressData),
      });

      // Mise à jour du projet local avec toutes les informations d'adresse
      await updateProject({
        ...addressData,
        ai_address: selectedLocation.address,
        ai_city: selectedLocation.city,
        ai_zip_code: selectedLocation.zip_code,
        ai_country: selectedLocation.country,
      });

      toast.success("Localisation du projet mise à jour");
      setIsOpen(false);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'emplacement:", error);
      toast.error("Impossible de mettre à jour la localisation du projet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Ne pas fermer si on interagit avec les suggestions
        if (!open && interactingWithSuggestion.current) {
          console.log("Empêche fermeture pendant interaction avec suggestions");
          return;
        }
        setIsOpen(open);
      }}
    >
      <DialogTrigger asChild>
        <div id="address-edit-dialog-trigger" className="sr-only">
          Open Address Edit
        </div>
      </DialogTrigger>
      <DialogContent className="min-w-[90vw] min-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Modifier la localisation du projet</DialogTitle>
          <DialogDescription>
            Recherchez une adresse, cliquez sur la carte ou déplacez le marqueur
            pour sélectionner une nouvelle localisation.
          </DialogDescription>
        </DialogHeader>

        {/* Contenu principal de la boîte de dialogue en colonne */}
        <div className="flex flex-col gap-4 h-full">
          {/* Barre de recherche avec z-index élevé */}
          <div className="relative" style={{ zIndex: 1000 }} ref={searchBoxRef}>
            <Input
              placeholder="Rechercher une adresse..."
              className="pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Carte avec hauteur flexible */}
          <div className="w-full flex-grow">
            <div className="relative h-full min-h-[60vh] w-full rounded-md overflow-hidden border">
              {isMapLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 z-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                </div>
              )}
              <div
                ref={mapContainerRef}
                className="h-full w-full map-container"
                style={{ position: "relative", zIndex: 1 }}
              ></div>
            </div>
          </div>

          {/* Bloc d'informations sur l'adresse sélectionnée */}
          <div className="flex flex-col gap-1 border-2 border-stone-200 rounded-xl p-4">
            <h3 className="text-md font-medium">Adresse sélectionnée:</h3>
            <p className="text-md break-words">
              {selectedLocation?.address || "Aucune adresse sélectionnée"}
            </p>

            <div className="flex flex-wrap gap-6 mt-2">
              <div className="flex flex-col">
                <h3 className="text-md font-medium">Coordonnées:</h3>
                <p className="text-md">
                  {selectedLocation
                    ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                    : "Aucune coordonnée sélectionnée"}
                </p>
              </div>
              <div className="flex flex-col">
                <h3 className="text-md font-medium">Altitude:</h3>
                <p className="text-md">
                  {selectedLocation?.altitude !== undefined
                    ? `${selectedLocation.altitude.toFixed(2)} mètres`
                    : "Altitude non disponible"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !selectedLocation}
          >
            {isLoading && (
              <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {isLoading ? "Enregistrement..." : "Modifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
