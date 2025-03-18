import React from "react";
import { cn } from "@/src/lib/utils";

type StatusType = "pending" | "progress" | "completed" | "error";

interface StatusPastilleProps extends React.HTMLAttributes<HTMLDivElement> {
  status: StatusType;
}

export function StatusPastille({
  status,
  className,
  ...props
}: StatusPastilleProps) {
  const getStatusColor = (status: StatusType) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"; // Yellow for pending
      case "progress":
        return "bg-purple-500 animate-pulse"; // Purple with blinking animation for progress
      case "completed":
        return "bg-green-500"; // Green for completed
      case "error":
        return "bg-red-500"; // Red for error
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={cn("w-2 h-2 rounded-full", getStatusColor(status), className)}
      {...props}
    />
  );
}
