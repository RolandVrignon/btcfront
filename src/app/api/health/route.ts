import { NextResponse } from "next/server";
import { logger } from "@/src/utils/logger";
export async function GET() {
  try {
    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 },
    );
  } catch (error) {
    logger.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", message: "Service unavailable" },
      { status: 503 },
    );
  }
}
