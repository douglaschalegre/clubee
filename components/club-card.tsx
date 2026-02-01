import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ClubAvatar } from "@/components/club-avatar";

interface ClubCardProps {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
}

export function ClubCard({ id, name, description, imageUrl }: ClubCardProps) {
  return (
    <Link href={`/clubs/${id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex gap-4 p-4">
          <ClubAvatar name={name} imageUrl={imageUrl} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold">{name}</h3>
            {description && (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
