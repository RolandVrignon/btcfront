import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";
import { Server as IOServer } from "socket.io";

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
  console.log("emit-deliverable-update : ", req.body);

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { id, projectId, status, type, code, message, updated_at } = req.body;

  if (res.socket.server.io) {
    console.log("emit project update to socket");
    res.socket.server.io
      .to(projectId)
      .emit("deliverableUpdate", { id, status, type, code, message, updated_at });
  }

  res.status(200).json({ ok: true });
}
