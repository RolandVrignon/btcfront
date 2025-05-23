import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/src/utils/logger";

// Schema for body validation
const bodySchema = z.object({
  projectId: z.string(), // project id
  fileName: z.string(), // file name
  documentId: z.string(), // document id
  extraction_status: z.enum([
    "UPLOAD",
    "DRAFT",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
    "ERROR",
  ]), // extraction status
  indexation_status: z.enum([
    "UPLOAD",
    "DRAFT",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
    "ERROR",
  ]), // indexation status
  extraction_message: z.string(), // extraction message
  indexation_message: z.string(), // indexation message
  code: z.number(), // code
  tags: z.array(z.string()), // tags (array of strings) - Example : ["CCTP", "DCE", "Plan"]
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

  const {
    projectId,
    fileName,
    documentId,
    extraction_status,
    indexation_status,
    extraction_message,
    indexation_message,
    code,
    tags,
  } = parseResult.data;

  logger.info("Document updated : ", {
    projectId,
    fileName,
    documentId,
    extraction_status,
    indexation_status,
    extraction_message,
    indexation_message,
    code,
    tags,
  });

  const emitDocumentUpdateUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/emit-document-update`;
  logger.info("emitDocumentUpdateUrl:", emitDocumentUpdateUrl);

  await fetch(emitDocumentUpdateUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId,
      fileName,
      documentId,
      extraction_status,
      indexation_status,
      extraction_message,
      indexation_message,
      code,
      tags,
    }),
  });

  return NextResponse.json({ success: true });
}
