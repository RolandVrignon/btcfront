import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, downloadUrls } = body;

    if (
      !projectId ||
      !downloadUrls ||
      !Array.isArray(downloadUrls) ||
      downloadUrls.length === 0
    ) {
      return NextResponse.json(
        { error: "projectId et fileNames sont requis" },
        { status: 400 },
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    const data = {
      projectId,
      downloadUrls,
      documentWebhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/update/document`,
      projectWebhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/update/project`,
    };

    // Appel à l'API externe
    const response = await fetch(
      `${apiUrl}/documents/confirm-multiple-uploads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Texte d'erreur brut:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
        logger.error("Données d'erreur parsées:", errorData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        logger.error("Impossible de parser la réponse d'erreur comme JSON");
        errorData = { message: errorText };
      }

      return NextResponse.json(
        {
          error: "Erreur lors de la confirmation des uploads",
          details: errorData,
        },
        { status: response.status },
      );
    }

    const responseData = await response.json();
    return NextResponse.json(responseData);
  } catch (error) {
    logger.error("Erreur lors de la confirmation des uploads:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
