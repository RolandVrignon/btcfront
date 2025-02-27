import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, projectId } = body;

    if (!documentId || !projectId) {
      return NextResponse.json(
        { error: "documentId et projectId sont requis" },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    // Appel à l'API externe
    const response = await fetch(`${apiUrl}/documents/monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || '',
      },
      body: JSON.stringify({ documentId, projectId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: "Erreur lors de la surveillance du document", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur lors de la surveillance du document:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}