import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { logger } from "@/src/utils/logger";

let socket: Socket | null = null;

// Event data type for deliverable updates
interface DeliverableUpdateDataEvent {
  id: string;
  projectId: string;
  status: string;
  type: string;
  code: string;
  message: string;
  updated_at: string;
}

export function useDeliverableSocket(
  projectId: string | undefined,
  onUpdate: (data: DeliverableUpdateDataEvent) => void,
) {
  useEffect(() => {
    if (!projectId) return;

    if (!socket) {
      socket = io({
        path: "/api/socket",
        transports: ["websocket"],
      });
      logger.info("Deliverable Socket.io client initialized");
    }

    socket.emit("join", projectId);

    const handler = (data: DeliverableUpdateDataEvent) => {
      onUpdate(data);
    };
    socket.on("deliverableUpdate", handler);

    return () => {
      socket?.emit("leave", projectId);
      socket?.off("deliverableUpdate", handler);
    };
  }, [projectId, onUpdate]);
}
