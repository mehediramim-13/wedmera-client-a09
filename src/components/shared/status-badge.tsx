import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "pending"
      ? "status-pending"
      : ["approved", "accepted", "paid"].includes(normalized)
        ? "status-approved"
        : ["rejected", "failed", "blocked"].includes(normalized)
          ? "status-rejected"
          : normalized === "premium"
            ? "status-premium"
            : "status-cancelled";

  return (
    <Badge
      className={cn(
        "border-transparent font-medium capitalize",
        tone,
        className,
      )}
      variant="outline"
    >
      {status}
    </Badge>
  );
}
