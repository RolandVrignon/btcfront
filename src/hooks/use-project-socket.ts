import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Status } from "../types/type";

export interface ProjectUpdateEvent {
  projectId: string;
  status: Status;
}

let socket: Socket | null = null;

export function useProjectSocket(projectId: string | undefined, onUpdate: (data: ProjectUpdateEvent) => void) {
  useEffect(() => {
    if (!projectId) return;

    // Initialise la connexion si ce n'est pas déjà fait
    if (!socket) {
      socket = io({
        path: "/api/socket",
        transports: ["websocket"],
      });
    }

    // S'abonner à la room du projet
    socket.emit("join", projectId);

    // Écouter l'event projectUpdate
    socket.on("projectUpdate", (data) => {
      if (data.projectId === projectId) {
        onUpdate(data);
      }
    });

    // Nettoyage à la désinscription
    return () => {
      socket?.emit("leave", projectId);
      socket?.off("projectUpdate");
    };
  }, [projectId, onUpdate]);
}