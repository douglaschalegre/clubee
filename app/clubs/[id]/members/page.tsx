import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/member-card";
import { MembershipToggle } from "@/components/membership-toggle";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MembersPage({ params }: PageProps) {
  const { id: clubId } = await params;
  const session = await auth0.getSession();

  // Require login
  if (!session) {
    redirect("/auth/login");
  }

  // Get current user
  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  // Fetch club
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      name: true,
      organizerId: true,
    },
  });

  if (!club) {
    notFound();
  }

  // Check membership
  const userMembership = await prisma.membership.findUnique({
    where: {
      userId_clubId: { userId: dbUser.id, clubId },
    },
  });

  // Require active membership (Task 23)
  if (!userMembership || userMembership.status !== "active") {
    redirect(`/clubs/${clubId}?error=inactive`);
  }

  const isOrganizer = club.organizerId === dbUser.id;

  // Fetch members with role-based data
  const memberships = await prisma.membership.findMany({
    where: { clubId },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          ...(isOrganizer && {
            email: true,
            phone: true,
          }),
        },
      },
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/clubs/${clubId}`} className="hover:underline">
              {club.name}
            </Link>
            <span>/</span>
            <span>Members</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">
            Members ({memberships.length})
          </h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/clubs/${clubId}`}>Back to Club</Link>
        </Button>
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {memberships.map((membership) => (
          <MemberCard
            key={membership.id}
            id={membership.user.id}
            name={membership.user.name}
            avatarUrl={membership.user.avatarUrl}
            role={membership.role}
            status={membership.status}
            joinedAt={membership.createdAt}
            email={isOrganizer ? (membership.user as { email?: string }).email : undefined}
            phone={isOrganizer ? (membership.user as { phone?: string }).phone : undefined}
            toggleComponent={
              isOrganizer && membership.role !== "organizer" ? (
                <MembershipToggle
                  clubId={clubId}
                  userId={membership.user.id}
                  currentStatus={membership.status}
                />
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
