import { NextRequest } from "next/server";
import { db } from "@/src/lib/db";
import { logger } from "@/src/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const { userId } = await params;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "18");
    const skip = (page - 1) * limit;

    const projects = await db.project.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    if (!projects) {
      logger.error("Aucun projet trouvé");
      return new Response(JSON.stringify({ error: "Aucun projet trouvé" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      logger.debug("Projets récupérés avec succès");
      return new Response(JSON.stringify(projects), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error: unknown) {
    // Afficher l'erreur de manière sécurisée
    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    const errorStack =
      error instanceof Error ? error.stack : "Pas de stack trace disponible";
    process.stdout.write(`Erreur API: ${errorMessage}\n`);
    process.stdout.write(`Stack: ${errorStack}\n`);

    // Inclure plus d'informations dans la réponse en développement
    const isDev = process.env.NODE_ENV === "development";

    logger.error("Erreur lors de la récupération des projets:", error);
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la récupération des projets",
        details: isDev ? errorMessage : undefined,
        stack: isDev ? errorStack : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
