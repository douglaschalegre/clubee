import Link from "next/link";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubAvatar } from "@/components/club-avatar";
import { MembershipStatusBadge } from "@/components/membership-status-badge";
import { LeaveButton } from "@/components/leave-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClubDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth0.getSession();

  // Fetch club with organizer info
  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      organizer: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Get current user's membership if logged in
  let membership = null;
  let dbUser = null;
  if (session) {
    dbUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      select: { id: true },
    });

    if (dbUser) {
      membership = await prisma.membership.findUnique({
        where: {
          userId_clubId: { userId: dbUser.id, clubId: id },
        },
      });
    }
  }

  const isOrganizer = dbUser?.id === club.organizerId;
  const isMember = !!membership;
  const isActiveMember = membership?.status === "active";

  return (
    <div>
      {/* Club Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ClubAvatar
          name={club.name}
          imageUrl={club.imageUrl}
          size="lg"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{club.name}</h1>
              <p className="mt-1 text-muted-foreground">
                Organized by {club.organizer.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isOrganizer && (
                <Badge variant="outline">Organizer</Badge>
              )}
              {membership && (
                <MembershipStatusBadge status={membership.status} />
              )}
            </div>
          </div>

          {club.description && (
            <p className="mt-4 text-foreground">{club.description}</p>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            {!session ? (
              <Button asChild>
                <a href="/auth/login">Login to Join</a>
              </Button>
            ) : !isMember ? (
              <Button asChild>
                <Link href={`/clubs/${id}/join`}>Join Club</Link>
              </Button>
            ) : isActiveMember ? (
              <Button asChild>
                <Link href={`/clubs/${id}/members`}>View Members</Link>
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Membership Inactive
              </Button>
            )}

            {isActiveMember && !isOrganizer && (
              <LeaveButton clubId={id} />
            )}

            {isOrganizer && (
              <Button variant="outline" asChild>
                <Link href={`/clubs/${id}/settings`}>Settings</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
