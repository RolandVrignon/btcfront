import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Status } from "../types/type";
import { logger } from "@/src/utils/logger";
export interface ProjectUpdateDataEvent {
  projectId: string;
  status: Status;
  code: string;
  message: string;
}

let socket: Socket | null = null;

export function useProjectSocket(
  projectId: string | undefined,
  onUpdate: (data: ProjectUpdateDataEvent) => void,
) {
  useEffect(() => {
    if (!projectId) {
      logger.info(
        "Webhook useProjectSocket: Pas de projectId, pas d'abonnement",
      );
      return;
    }
    
    if (!socket) {
      socket = io({
        path: "/api/socket",
        transports: ["websocket"],
      });
      logger.info("Webhook Socket.io client initialisé");
    }

    socket.emit("join", projectId);

    const handler = (data: ProjectUpdateDataEvent) => {
      if (data.projectId === projectId) {
        onUpdate(data);
      }
    };
    socket.on("projectUpdate", handler);

    // Log du cleanup
    return () => {
      logger.info(
        "Webhook useProjectSocket: Désabonnement de la room",
        projectId,
      );
      socket?.emit("leave", projectId);
      socket?.off("projectUpdate", handler);
    };
  }, [projectId, onUpdate]);
}
