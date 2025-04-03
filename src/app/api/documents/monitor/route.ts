import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, projectId } = body;

    if (!documentId || !projectId) {
      return NextResponse.json(
        { error: "documentId et projectId sont requis" },
        { status: 208 },
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    logger.info(
      `[Monitor] Calling external API for document ${documentId} in project ${projectId}`,
    );
    logger.debug(`[Monitor] API URL: ${apiUrl}/documents/monitor`);

    // Appel à l'API externe
    const response = await fetch(`${apiUrl}/documents/monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      body: JSON.stringify({ documentId, projectId }),
    });

    logger.debug(`[Monitor] External API response status: ${response.status}`);

    if (response.status === 404) {
      logger.info(
        `[Monitor] Document not found in external API. Response:`,
        await response.text(),
      );
      return NextResponse.json({
        status: "PENDING",
        indexation_status: "PENDING",
        message: "Document en cours de traitement",
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      logger.error(`[Monitor] Error from external API:`, errorData);
      return NextResponse.json(
        {
          error: "Erreur lors de la surveillance du document",
          details: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    logger.debug(
      `[Monitor] Success response for document ${documentId}:`,
      data,
    );
    return NextResponse.json(data);
  } catch (error) {
    logger.error("[Monitor] Internal error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
