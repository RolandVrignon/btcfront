import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { externalId: string } },
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Utiliser les paramètres de manière sûre
    const externalId = params.externalId;
    if (!externalId) {
      return NextResponse.json(
        { error: "ID externe manquant" },
        { status: 400 },
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    // Appeler l'API externe pour récupérer les documents
    const response = await fetch(`${apiUrl}/documents/project/${externalId}`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des documents",
          details: errorData,
        },
        { status: response.status },
      );
    }

    const documents = await response.json();
    return NextResponse.json(documents);
  } catch (error) {
    console.error("Erreur lors de la récupération des documents:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
