import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/utils/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, fileName } = body;

    if (!projectId || !fileName) {
      return NextResponse.json(
        { error: "projectId et fileName sont requis" },
        { status: 400 },
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    // Appel à l'API externe
    const response = await fetch(`${apiUrl}/documents/confirm-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      body: JSON.stringify({ projectId, fileName }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: "Erreur lors de la confirmation de l'upload",
          details: errorData,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    logger.error("Erreur lors de la confirmation de l'upload:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
