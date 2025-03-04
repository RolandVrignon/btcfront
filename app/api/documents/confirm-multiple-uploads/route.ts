import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, fileNames } = body;

    if (
      !projectId ||
      !fileNames ||
      !Array.isArray(fileNames) ||
      fileNames.length === 0
    ) {
      return NextResponse.json(
        { error: "projectId et fileNames sont requis" },
        { status: 400 },
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    // Appel à l'API externe
    const response = await fetch(
      `${apiUrl}/documents/confirm-multiple-uploads`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
        },
        body: JSON.stringify({
          projectId,
          fileNames,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Texte d'erreur brut:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error("Données d'erreur parsées:", errorData);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        console.error("Impossible de parser la réponse d'erreur comme JSON");
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la confirmation des uploads:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
