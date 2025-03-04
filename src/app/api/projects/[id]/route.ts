import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import prisma from "@/src/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Utiliser les paramètres de manière sûre
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Récupérer le projet depuis la base de données
    const project = await prisma.project.findUnique({
      where: {
        id: id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à ce projet
    if (project.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
