import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { externalId, name, status, userId } = body;

    // Vérifier que l'utilisateur qui fait la requête est bien celui auquel le projet sera associé
    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Créer le projet dans la base de données
    const project = await prisma.project.create({
      data: {
        externalId,
        name,
        status: status === "DRAFT" ? "draft" : status.toLowerCase(),
        userId,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Récupérer les projets de l'utilisateur
    const projects = await prisma.project.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
