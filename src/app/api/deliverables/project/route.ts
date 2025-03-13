import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get("projectId");
  console.log("projectId:", projectId);
  const type = searchParams.get("type");
  console.log("type:", type);

  if (!projectId || !type) {
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

    console.log(response);

    if (!response.ok) {
      throw new Error(`Failed to fetch deliverables: ${response.statusText}`);
    }

    console.log(" JHUJASHEFJKdialghfjklsdghfsdjkafalkj");

    const deliverables = await response.json();

    // Check if a deliverable with the specified type already exists
    const existingDeliverable = deliverables.find(
      (deliverable: any) => deliverable.type === type,
    );

    if (existingDeliverable) {
      return NextResponse.json(existingDeliverable);
    }

    console.log("no existing deliverable found");

    const obj = {
      projectId: projectId,
      type: type,
    };

    console.log("obj:", obj);

    // If no existing deliverable found, create a new one
    const createResponse = await fetch(`${apiUrl}/deliverables`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
      },
      body: JSON.stringify(obj),
    });

    if (!createResponse.ok) {
      throw new Error(
        `Failed to create deliverable: ${createResponse.statusText}`,
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
