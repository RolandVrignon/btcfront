import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    console.log("Récupération des projets pour l'utilisateur:", params.userId);

    // Récupérer les projets de l'utilisateur sans vérification d'authentification
    const projects = await prisma.project.findMany({
      where: {
        userId: params.userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 20,
    });

    console.log("Projets trouvés:", projects.length);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 },
    );
  }
}
