import { useState, useEffect } from "react";
import { Badge } from "@/src/components/ui/badge";
import { Loader2 } from "lucide-react";

interface ProgressBadgeProps {
  createdAt?: Date | null;
  size?: "small" | "medium";
}

export function ProgressBadge({ createdAt, size = "medium" }: ProgressBadgeProps) {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    if (!createdAt) return;
    const start = createdAt.getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  // Format mm:ss
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  const formatted = `${m}:${s.toString().padStart(2, "0")}m`;

  // Badge and icon size classes
  const badgeClass =
    size === "small"
      ? "flex gap-1 items-center bg-yellow-100 text-yellow-700 px-1.5 py-0.5 text-xs font-medium"
      : "flex gap-1 items-center bg-yellow-100 text-yellow-700 px-2 py-0.5 text-sm font-medium";
  const iconClass = size === "small" ? "h-3 w-3" : "h-4 w-4";

  return (
    <Badge className={badgeClass}>
      <Loader2 className={`${iconClass} animate-spin text-yellow-700`} />
      En cours de génération... {formatted}
    </Badge>
  );
}