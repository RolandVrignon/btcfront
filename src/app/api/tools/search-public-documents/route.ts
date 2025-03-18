import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city") || "";

    const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

    // Appel à l'API externe
    const response = await fetch(`${apiUrl}/tools/city-documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      body: JSON.stringify({ city }),
    });

    const data = await response.json();

    console.log("🔴 data:", data);

    return NextResponse.json(data);
  } catch {
    console.error("src > api > tools > search-public-documents > route.ts - error");
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
