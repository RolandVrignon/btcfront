import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for body validation
const bodySchema = z.object({
  id: z.string(),
  status: z.enum([
    "UPLOAD",
    "DRAFT",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
    "ERROR",
  ]),
  type: z.string(),
  projectId: z.string(),
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

  const { id, status, type, projectId, code, message, updated_at } =
    parseResult.data;

  console.log("Deliverable updated : ", {
    id,
    status,
    type,
    projectId,
    code,
    message,
    updated_at,
  });

  return NextResponse.json({ success: true });
}
