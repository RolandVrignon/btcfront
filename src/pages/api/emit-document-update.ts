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
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
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
  } = req.body;

  if (res.socket.server.io) {
    res.socket.server.io.to(projectId).emit("documentUpdate", {
      fileName,
      documentId,
      extraction_status,
      indexation_status,
      extraction_message,
      indexation_message,
      code,
      tags,
    });
  }

  res.status(200).json({ ok: true });
}
