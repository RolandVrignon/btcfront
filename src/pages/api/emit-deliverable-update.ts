import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { Server as IOServer } from "socket.io";

// Type for Next.js API response with socket.io server
// ... existing code ...
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
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // Destructure deliverable update data from request body
  const { projectId, deliverableId, status, message, code } = req.body;

  // Emit deliverableUpdate event to the project room if socket.io is available
  if (res.socket.server.io) {
    res.socket.server.io
      .to(projectId)
      .emit("deliverableUpdate", { deliverableId, status, message, code });
  }

  res.status(200).json({ ok: true });
}
