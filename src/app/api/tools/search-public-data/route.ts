import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    const { city, address, country, projectId } = body;

    // Check if project already has publicData
    if (projectId) {
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
        select: { publicData: true },
      });

      if (
        existingProject?.publicData &&
        Object.keys(existingProject.publicData as object).length > 0
      ) {
        return NextResponse.json(existingProject.publicData);
      }
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    if (!city || !address || !apiUrl) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 },
      );
    }

    // Appel à l'API externe
    const response = await fetch(`${apiUrl}/tools/public-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      body: JSON.stringify({
        city,
        address,
        country,
      }),
    });

    const data = await response.json();

    // Update project with publicData
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: { publicData: data },
      });
    }

    return NextResponse.json(data);
  } catch {
    console.error("src > api > tools > search-public-data > route.ts - error");
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
