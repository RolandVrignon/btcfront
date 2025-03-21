import { NextRequest, NextResponse } from "next/server";
import { Deliverable } from "@/src/types/type";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  const type = searchParams.get("type");

  if (!projectId || !type) {
    console.error("Missing projectId or type parameter");
    return NextResponse.json(
      { error: "Missing projectId or type parameter" },
      { status: 400 },
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

  try {
    // Call the external API to get deliverables for the project
    const response = await fetch(
      `${apiUrl}/deliverables/project/${projectId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch deliverables: ${response.statusText}`);
    }

    const deliverables = await response.json();

    const existingDeliverable = deliverables.find(
      (deliverable: Deliverable) => deliverable.type === type,
    );

    if (existingDeliverable) {
      return NextResponse.json(existingDeliverable);
    }

    const createDeliverableApiUrl = `${apiUrl}/deliverables`;

    if (!process.env.NEXT_PUBLIC_CTIA_API_KEY) {
      throw new Error("NEXT_PUBLIC_CTIA_API_KEY is not set");
    }

    const createResponse = await fetch(createDeliverableApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY,
      },
      body: JSON.stringify({
        projectId: projectId,
        type: type,
      }),
    });

    if (!createResponse.ok) {
      console.error(
        `Failed to create deliverable: ${JSON.stringify(createResponse, null, 2)}`,
      );
    }

    const newDeliverable = await createResponse.json();

    return NextResponse.json(newDeliverable);
  } catch (error) {
    console.error("Error handling deliverable:", error);
    return NextResponse.json(
      { error: "Failed to process deliverable request" },
      { status: 500 },
    );
  }
}
