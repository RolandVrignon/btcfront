import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Schema for body validation
const bodySchema = z.object({
  projectId: z.string(),
  status: z.enum([
    "UPLOAD",
    "DRAFT",
    "PENDING",
    "PROGRESS",
    "COMPLETED",
    "ERROR",
  ]),
  code: z.number(),
  message: z.string(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  console.log("Body : ", body);

  const parseResult = bodySchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors },
      { status: 400 },
    );
  }

  const { projectId, status, code, message } = parseResult.data;

  console.log("Project updated : ", { projectId, status, code, message });

  return NextResponse.json({ success: true });
}
