import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/src/utils/logger";
// Schema for body validation
const bodySchema = z.object({
  id: z.string(),
  projectId: z.string(),
  status: z.enum([
    "UPLOAD",
    "DRAFT",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
    "ERROR",
  ]),
  type: z.string(),
  code: z.number(),
  message: z.string(),
  updated_at: z.coerce.date(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parseResult = bodySchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors },
      { status: 400 },
    );
  }

  const { id, projectId, status, type, code, message, updated_at } =
    parseResult.data;

  logger.info("Deliverable updated : ", {
    id,
    projectId,
    status,
    type,
    code,
    message,
    updated_at,
  });

  const emitDeliverableUpdateUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/emit-deliverable-update`;
  logger.info("emitDeliverableUpdateUrl:", emitDeliverableUpdateUrl);

  await fetch(emitDeliverableUpdateUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      projectId,
      status,
      type,
      code,
      message,
      updated_at,
    }),
  });

  return NextResponse.json({ success: true });
}
