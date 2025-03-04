import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, fileNames } = body;

    console.log("Confirmation des uploads multiple");
    console.log("body:", body);
    console.log("Before if");

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

    console.log("After if");
    console.log("projectId:", projectId);
    console.log("fileNames:", fileNames);

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;
    console.log(
      "URL de l'API:",
      `${apiUrl}/documents/confirm-multiple-uploads`,
    );

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

    // Ajouter des logs pour la réponse
    console.log("Statut de la réponse:", response.status);
    console.log(
      "Headers de la réponse:",
      Object.fromEntries(response.headers.entries()),
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
