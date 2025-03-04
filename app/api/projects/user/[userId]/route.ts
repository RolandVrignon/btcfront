import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;

  try {
    console.log("Récupération des projets pour l'utilisateur:", userId);

    // Utiliser directement userId sans référence supplémentaire à params
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    console.log("Projets trouvés:", projects.length);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
