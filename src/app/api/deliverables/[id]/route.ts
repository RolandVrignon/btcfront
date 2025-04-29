import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/src/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Attendre les paramètres avant de les utiliser
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing deliverable ID" },
      { status: 400 },
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

  try {
    // Call the external API to get the deliverable status
    const response = await fetch(`${apiUrl}/deliverables/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch deliverable: ${response.statusText}`);
    }

    const deliverable = await response.json();

    return NextResponse.json(deliverable);
  } catch (error) {
    logger.error("Error monitoring deliverable:", error);
    return NextResponse.json(
      { error: "Failed to monitor deliverable" },
      { status: 500 },
    );
  }
}
