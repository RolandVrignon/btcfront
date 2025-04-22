import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { logger } from "@/src/utils/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID du projet requis" },
        { status: 400 },
      );
    }

    const data = await req.json();
    console.log('data:', data)

    // Validate required fields
    const requiredFields = [
      "closest_formatted_address",
      "latitude",
      "longitude",
      "altitude",
      "city",
      "zip_code",
      "country",
    ];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 },
        );
      }
    }

    // Construction of update address DTO
    const updateAddressDto = {
      closest_formatted_address: data.closest_formatted_address,
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      altitude: Number(data.altitude),
      ai_city: data.city,
      ai_zip_code: data.zip_code,
      ai_country: data.country,
    };
    logger.info("updateAddressDto:", updateAddressDto);

    // Call the backend API to update the address
    const apiUrl = `${process.env.NEXT_PUBLIC_CTIA_API_URL}/projects/${id}/address`;
    logger.info("apiUrl:", apiUrl);

    const apiKey = process.env.NEXT_PUBLIC_CTIA_API_KEY || "";
    logger.info("apiKey:", apiKey);

    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      body: JSON.stringify(updateAddressDto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error(`Erreur API (${response.status}):`, errorData);

      return NextResponse.json(
        {
          error: "Erreur lors de la mise à jour de l'adresse",
          details: errorData,
        },
        { status: response.status },
      );
    }

    const updatedProject = await response.json();
    return NextResponse.json(updatedProject);
  } catch (error) {
    logger.error(
      "Erreur lors de la mise à jour de l'adresse du projet:",
      error,
    );
    return NextResponse.json(
      { error: "Erreur serveur lors de la mise à jour de l'adresse" },
      { status: 500 },
    );
  }
}
