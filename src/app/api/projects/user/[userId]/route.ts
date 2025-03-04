import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { userId } = params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "14");
    const offset = (page - 1) * limit;

    const projects = await prisma.project.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        updatedAt: "desc", // Tri par date de mise à jour décroissante
      },
      skip: offset,
      take: limit,
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 },
    );
  }
}
