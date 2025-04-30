import { Server as IOServer } from "socket.io";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Server as HTTPServer } from "http";
import type { Socket } from "net";

// Typage pour étendre la réponse Next.js
type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (!res.socket.server.io) {
    // Crée le serveur Socket.io s'il n'existe pas déjà
    const io = new IOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: { origin: "*" },
    });

    // Gestion des rooms (projets)
    io.on("connection", (socket) => {
      socket.on("join", (projectId) => {
        socket.join(projectId);
      });
      socket.on("leave", (projectId) => {
        socket.leave(projectId);
      });
    });

    res.socket.server.io = io;
  }
  res.end();
}