import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { logger } from "@/src/utils/logger";

let socket: Socket | null = null;

interface DocumentUpdateDataEvent {
  projectId: string;
  fileName: string;
  documentId: string;
  extraction_status: string;
  indexation_status: string;
  extraction_message: string;
  indexation_message: string;
  code: string;
  tags: string[];
}

export function useDocumentSocket(
  projectId: string | undefined,
  onUpdate: (data: DocumentUpdateDataEvent) => void,
) {
  useEffect(() => {
    if (!projectId) return;

    if (!socket) {
      socket = io({
        path: "/api/socket",
        transports: ["websocket"],
      });
      logger.info("Webhook Socket.io client initialisé");
    }

    socket.emit("join", projectId);

    const handler = (data: DocumentUpdateDataEvent) => {
      onUpdate(data);
    };
    socket.on("documentUpdate", handler);

    return () => {
      socket?.emit("leave", projectId);
      socket?.off("documentUpdate", handler);
    };
  }, [projectId, onUpdate]);
}
