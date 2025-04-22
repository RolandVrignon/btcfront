import { NextRequest, NextResponse } from "next/server";
import { Deliverable } from "@/src/types/type";
import { logger } from "@/src/utils/logger";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const {
    projectId,
    type,
    documentIds,
    user_prompt,
    new: new_deliverable,
  } = body;

  if (!projectId || !type) {
    logger.error("Missing projectId or type parameter");
    return NextResponse.json(
      { error: "Missing projectId or type parameter" },
      { status: 400 },
    );
  }

  logger.info("body", body);
  logger.info("projectId", projectId);
  logger.info("type", type);
  logger.info("documentIds", documentIds);
  logger.info("user_prompt", user_prompt);
  logger.info("new_deliverable", new_deliverable);

  const apiUrl = process.env.NEXT_PUBLIC_CTIA_API_URL;

  try {
    if (!new_deliverable) {
      logger.info("fetching deliverables without creating new one");

      const response = await fetch(
        `${apiUrl}/deliverables/project/${projectId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": process.env.NEXT_PUBLIC_CTIA_API_KEY || "",
          },
        },
      );

      logger.info("response", response);

      if (!response.ok) {
        throw new Error(`Failed to fetch deliverables: ${response.statusText}`);
      }

      const deliverables = await response.json();

      const existingDeliverables = deliverables.filter(
        (deliverable: Deliverable) => deliverable.type === type,
      );

      // Sort existingDeliverables by createdAt from oldest to newest
      existingDeliverables.sort((a: Deliverable, b: Deliverable) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

      if (existingDeliverables) {
        logger.info("existingDeliverables", existingDeliverables);
        return NextResponse.json(existingDeliverables);
      }
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
        documentIds: documentIds ? documentIds : [],
        user_prompt: user_prompt ? user_prompt : "",
        new: new_deliverable ? new_deliverable : false,
      }),
    });

    logger.info("createResponse", createResponse);

    if (!createResponse.ok) {
      logger.error(
        `Failed to create deliverable: ${JSON.stringify(createResponse, null, 2)}`,
      );
    }

    const newDeliverable = await createResponse.json();

    logger.info("Our new deliverable in backend route:", newDeliverable);

    return NextResponse.json([newDeliverable]);
  } catch (error) {
    logger.error("Error handling deliverable:", error);
    return NextResponse.json(
      { error: "Failed to process deliverable request" },
      { status: 500 },
    );
  }
}
