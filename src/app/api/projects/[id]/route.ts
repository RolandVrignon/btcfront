import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { Project } from "@/src/types/type";
import prisma from "@/src/lib/prisma";

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

    // Filtrer les données pour ne retourner que les champs correspondant au type Project
    const filteredProjectData: Project = {
      id: "",
      name: externalProjectData?.name || "",
      short_summary: externalProjectData?.short_summary || "",
      long_summary: externalProjectData?.long_summary || "",
      ai_address: externalProjectData?.ai_address || "",
      ai_city: externalProjectData?.ai_city || "",
      ai_zip_code: externalProjectData?.ai_zip_code || "",
      ai_country: externalProjectData?.ai_country || "",
      status: externalProjectData?.status || "",
      externalId: externalProjectData?.id || "",
      closest_formatted_address:
        externalProjectData?.closest_formatted_address || "",
      latitude: externalProjectData?.latitude || "",
      longitude: externalProjectData?.longitude || "",
    };

    console.log("filteredProjectData", filteredProjectData);

    try {
      // Utiliser upsert pour créer ou mettre à jour le projet
      const project = await prisma.project.upsert({
        where: {
          externalId: id,
        },
        update: {
          short_summary: filteredProjectData.short_summary,
          long_summary: filteredProjectData.long_summary,
          name: filteredProjectData.name,
          ai_address: filteredProjectData.ai_address,
          ai_city: filteredProjectData.ai_city,
          ai_zip_code: filteredProjectData.ai_zip_code,
          ai_country: filteredProjectData.ai_country,
          status: filteredProjectData.status,
        },
        create: {
          externalId: id,
          short_summary: filteredProjectData.short_summary,
          long_summary: filteredProjectData.long_summary,
          name: filteredProjectData.name,
          ai_address: filteredProjectData.ai_address,
          ai_city: filteredProjectData.ai_city,
          ai_zip_code: filteredProjectData.ai_zip_code,
          ai_country: filteredProjectData.ai_country,
          status: filteredProjectData.status,
          userId: session.user.id,
        },
      });

      filteredProjectData.id = project.id;

      return NextResponse.json(filteredProjectData);
    } catch (error) {
      console.error(
        "Erreur lors de la création ou mise à jour du projet:",
        error,
      );
    }

    return NextResponse.json(filteredProjectData);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
