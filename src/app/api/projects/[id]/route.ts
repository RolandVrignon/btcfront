import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { Project } from "@/src/types/project";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Utiliser les paramètres de manière sûre
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Récupérer les informations du projet depuis l'API externe
    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Configuration API manquante" },
        { status: 500 },
      );
    }

    const response = await fetch(`${apiUrl}/projects/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Erreur lors de la récupération des informations du projet",
          details: errorData,
        },
        { status: response.status },
      );
    }

    const externalProjectData = await response.json();
    console.log("externalProjectData:", externalProjectData);

    // Filtrer les données pour ne retourner que les champs correspondant au type Project
    const filteredProjectData: Project = {
      id: externalProjectData?.id,
      name: externalProjectData?.name,
      description: externalProjectData?.description,
      ai_address: externalProjectData?.address,
      ai_city: externalProjectData?.city,
      ai_zip_code: externalProjectData?.zipCode,
      ai_country: externalProjectData?.country,
    };

    console.log("filteredProjectData:", filteredProjectData);

    await prisma.project.update({
      where: {
        externalId: id,
      },
      data: {
        description: filteredProjectData.description,
        name: filteredProjectData.name,
      },
    });

    return NextResponse.json(filteredProjectData);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
