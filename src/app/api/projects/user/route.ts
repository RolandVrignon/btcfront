import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { logger } from "@/src/utils/logger";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Configuration API manquante" },
        { status: 500 },
      );
    }

    const response = await fetch(`${apiUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Erreur lors de la création du projet", details: errorData },
        { status: response.status },
      );
    }

    const data = await response.json();
    logger.info("data:", data);

    return NextResponse.json(data);
  } catch (error) {
    logger.error("Erreur lors de la création du projet:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création du projet" },
      { status: 500 },
    );
  }
}
