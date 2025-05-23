import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// import { logger } from "@/src/utils/logger";

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

  console.log("body:", body);

  const parseResult = bodySchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: parseResult.error.errors },
      { status: 400 },
    );
  }

  const { projectId, status, code, message } = parseResult.data;

  console.log("Project updated : ", { projectId, status, code, message });

  const emitProjectUpdateUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/emit-project-update`;
  console.log("emitProjectUpdateUrl:", emitProjectUpdateUrl);

  await fetch(emitProjectUpdateUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, status, code, message }),
  });

  return NextResponse.json({ success: true });
}
