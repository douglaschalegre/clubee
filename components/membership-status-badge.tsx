import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";

interface MembershipStatusBadgeProps {
  status: "active" | "inactive";
  className?: string;
}

export function MembershipStatusBadge({
  status,
  className,
}: MembershipStatusBadgeProps) {
  if (status === "active") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "gap-1 border-teal-500/30 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20",
          className
        )}
      >
        <CheckCircle2 className="h-3 w-3" />
        Active
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-gray-400/30 bg-gray-400/10 text-gray-600 hover:bg-gray-400/20",
        className
      )}
    >
      <XCircle className="h-3 w-3" />
      Inactive
    </Badge>
  );
}
