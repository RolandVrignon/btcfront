import { NextRequest, NextResponse } from "next/server";
import { Deliverable } from "@/src/types/type";
import { logger } from "@/src/utils/logger";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();

  const {
    projectId,
    type,
    documentIds,
    user_prompt,
    new: new_deliverable,
  } = body;

  logger.info("deliverables route : ", body);

  if (!projectId || !type) {
    logger.error("Missing projectId or type parameter");
    return NextResponse.json(
      { error: "Missing projectId or type parameter" },
      { status: 400 },
    );
  }

  const completeApiUrl = `${process.env.NEXT_PUBLIC_CTIA_API_URL}/deliverables/project/${projectId}`;
  const webhook_url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/update/deliverable`;

  try {
    if (!new_deliverable) {
      logger.info("fetching deliverables without creating new one");

      const response = await fetch(`${completeApiUrl}`, {
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch deliverables: ${response.statusText}`);
      }

      const deliverables: Deliverable[] = await response.json();

      const existingDeliverables = deliverables.filter(
        (deliverable: Deliverable) => deliverable.type === type,
      );

      // Sort existingDeliverables by createdAt from oldest to newest
      existingDeliverables.sort((a: Deliverable, b: Deliverable) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

      return NextResponse.json<Deliverable[]>(existingDeliverables);
    }

    const createDeliverableApiUrl = `${process.env.NEXT_PUBLIC_CTIA_API_URL}/deliverables`;

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
        documentIds: documentIds ? documentIds : [],
        user_prompt: user_prompt ? user_prompt : "",
        new: new_deliverable ? new_deliverable : false,
        webhookUrl: webhook_url,
      }),
    });

    if (!createResponse.ok) {
      logger.error(
        `createResponse : Failed to create deliverable: ${JSON.stringify(createResponse, null, 2)}`,
      );
    }

    const newDeliverable: Deliverable = await createResponse.json();

    return NextResponse.json<Deliverable[]>([newDeliverable]);
  } catch (error) {
    logger.error("Error handling deliverable:", error);
    return NextResponse.json(
      { error: "Failed to process deliverable request" },
      { status: 500 },
    );
  }
}
