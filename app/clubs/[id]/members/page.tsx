import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { MemberCard } from "@/components/member-card";
import { MembershipToggle } from "@/components/membership-toggle";
import { RemoveMemberButton } from "@/components/remove-member-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { ArrowLeft, Users } from "lucide-react";

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
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Clubes", href: "/clubs" },
          { label: club.name, href: `/clubs/${clubId}` },
          { label: "Membros" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Membros
            </h1>
            <p className="text-sm text-muted-foreground">
              {memberships.length} {memberships.length === 1 ? "pessoa" : "pessoas"} neste clube
            </p>
          </div>
        </div>
        
        <Button variant="outline" asChild className="gap-2 shrink-0">
          <Link href={`/clubs/${clubId}`}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao clube
          </Link>
        </Button>
      </div>

      {/* Members List */}
      <div className="stagger-in space-y-3">
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
            removeComponent={
              isOrganizer && membership.role !== "organizer" ? (
                <RemoveMemberButton
                  clubId={clubId}
                  userId={membership.user.id}
                  memberName={membership.user.name}
                />
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
