import { NextResponse } from "next/server";

export async function GET() {
  // Cette fonction s'exécute côté serveur, donc les variables d'environnement sont toujours disponibles
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Vérifier si la clé est définie
  if (!googleMapsApiKey) {
    console.error(
      "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY n'est pas définie dans les variables d'environnement",
    );
  } else {
    console.log("Clé API Google Maps récupérée avec succès côté serveur");
  }

  // Retourner la clé API dans la réponse
  return NextResponse.json({
    googleMapsApiKey,
  });
}
