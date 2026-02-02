import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MembershipStatusBadge } from "@/components/membership-status-badge";
import { getInitials } from "@/lib/colors";
import { Crown, Mail, Phone, Calendar } from "lucide-react";

interface MemberCardProps {
  id: string;
  name: string;
  avatarUrl?: string | null;
  role: "organizer" | "member";
  status: "active" | "inactive";
  joinedAt: Date | string;
  // Organizer-only fields
  email?: string;
  phone?: string;
  // Toggle component (passed in for organizer view)
  toggleComponent?: React.ReactNode;
  // Remove component (passed in for organizer view)
  removeComponent?: React.ReactNode;
}

export function MemberCard({
  name,
  avatarUrl,
  role,
  status,
  joinedAt,
  email,
  phone,
  toggleComponent,
  removeComponent,
}: MemberCardProps) {
  const joinDate = new Date(joinedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm">
      {/* Avatar */}
      <Avatar className="h-12 w-12 ring-2 ring-background shadow">
        <AvatarImage src={avatarUrl ?? undefined} alt={name} />
        <AvatarFallback className="bg-muted text-sm font-medium">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {role === "organizer" && (
            <Badge variant="outline" className="shrink-0 gap-1 border-primary/30 bg-primary/5 text-primary">
              <Crown className="h-3 w-3" />
              Organizer
            </Badge>
          )}
          <MembershipStatusBadge status={status} className="shrink-0" />
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Joined {joinDate}
          </span>
          {email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </span>
          )}
          {phone && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {phone}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {toggleComponent && (
          <div className="shrink-0">{toggleComponent}</div>
        )}

        {removeComponent && (
          <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
            {removeComponent}
          </div>
        )}
      </div>
    </div>
  );
}
