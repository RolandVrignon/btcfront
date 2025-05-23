import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { Server as IOServer } from "socket.io";
// import { logger } from "@/src/utils/logger";
type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket,
) {
  console.log("emit-project-update");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { projectId, status, code, message } = req.body;

  console.log("projectId:", projectId);
  console.log("status:", status);

  if (res.socket.server.io) {
    console.log("emit project update to socket");
    res.socket.server.io
      .to(projectId)
      .emit("projectUpdate", { projectId, status, code, message });
  }

  res.status(200).json({ ok: true });
}
