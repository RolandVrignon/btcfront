import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const { userId } = await params;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "14");
    const skip = (page - 1) * limit;

    const projects = await db.project.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        updatedAt: "desc", // Tri par date de mise à jour décroissante
      },
      skip,
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
