import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MembershipStatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function MembershipStatusBadge({
  status,
  className,
}: MembershipStatusBadgeProps) {
  return (
    <Badge
      variant={status === "active" ? "default" : "secondary"}
      className={cn(
        status === "active"
          ? "bg-green-600 hover:bg-green-700"
          : "bg-gray-400 hover:bg-gray-500",
        className
      )}
    >
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}
