import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MembershipStatusBadge } from "@/components/membership-status-badge";
import { getInitials } from "@/lib/colors";

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
}: MemberCardProps) {
  const joinDate = new Date(joinedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4">
      <Avatar className="h-12 w-12">
        <AvatarImage src={avatarUrl ?? undefined} alt={name} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {role === "organizer" && (
            <Badge variant="outline" className="shrink-0">
              Organizer
            </Badge>
          )}
          <MembershipStatusBadge status={status} className="shrink-0" />
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>Joined {joinDate}</span>
          {email && <span>{email}</span>}
          {phone && <span>{phone}</span>}
        </div>
      </div>

      {toggleComponent && (
        <div className="shrink-0">{toggleComponent}</div>
      )}
    </div>
  );
}
