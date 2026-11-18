import { Badge } from "@/components/ui/badge";

export function VendorBadge({ premium }: { premium: boolean }) {
  if (!premium) return null;

  return (
    <Badge className="status-premium border-transparent gap-1">
      <span aria-hidden="true">✦</span>
      Premium
    </Badge>
  );
}
