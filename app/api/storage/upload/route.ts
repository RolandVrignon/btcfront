import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const presignedUrl = formData.get("presignedUrl") as string;
    const contentType = formData.get("contentType") as string;

    if (!file || !presignedUrl) {
      return NextResponse.json(
        { error: "Le fichier et l'URL présignée sont requis" },
        { status: 400 },
      );
    }

    // Faire la requête à S3 depuis le serveur (pas de problème CORS)
    const response = await fetch(presignedUrl, {
      method: "PUT",
      headers: {
        "Content-Type": contentType || file.type,
      },
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Erreur inconnue");
      return NextResponse.json(
        {
          error: "Erreur lors de l'upload vers S3",
          status: response.status,
          details: errorText,
        },
        { status: response.status },
      );
    }

    console.log("Fichier uploadé avec succès");
    console.log("response:", response);

    return NextResponse.json({
      success: true,
      status: response.status,
      message: "Fichier uploadé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload du fichier" },
      { status: 500 },
    );
  }
}
