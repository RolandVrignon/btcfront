import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, projectId } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "Le nom et le type du fichier sont requis" },
        { status: 400 },
      );
    }

    logger.debug("fileName:", fileName);
    logger.debug("fileType:", fileType);
    logger.debug("projectId:", projectId);

    // Récupérer l'URL de l'API depuis les variables d'environnement
    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;
    logger.debug("apiUrl:", apiUrl);

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Configuration API manquante" },
        { status: 500 },
      );
    }

    const object = {
      fileName: fileName,
      contentType: fileType,
      projectId: projectId || null,
    };

    logger.debug("object:", object);

    // Faire la requête à l'API externe
    const response = await fetch(`${apiUrl}/storage/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      body: JSON.stringify(object),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération de l'URL présignée",
          details: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    logger.error("ERROOOOOOOOOOOOOOOOR:", JSON.stringify(error, null, 2));
    logger.error("Error getting upload URL:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la génération de l'URL présignée" },
      { status: 500 },
    );
  }
}
