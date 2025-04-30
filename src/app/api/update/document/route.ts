import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for body validation
const bodySchema = z.object({
  projectId: z.string(),
  documentId: z.string(),
  extraction_status: z.enum([
    "UPLOAD",
    "DRAFT",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
    "ERROR",
  ]),
  indexation_status: z.enum([
    "UPLOAD",
    "DRAFT",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
    "ERROR",
  ]),
  extraction_message: z.string(),
  indexation_message: z.string(),
  code: z.number(),
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

  const { projectId, documentId, extraction_status, indexation_status, extraction_message, indexation_message, code } = parseResult.data;

  console.log("Document updated : ", {
    projectId,
    documentId,
    extraction_status,
    indexation_status,
    extraction_message,
    indexation_message,
    code,
  });

  return NextResponse.json({ success: true });
}
