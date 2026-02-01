import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubForm } from "@/components/club-form";
import { DeleteClubButton } from "@/components/delete-club-button";
import { MemberCard } from "@/components/member-card";
import { MembershipToggle } from "@/components/membership-toggle";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
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
      description: true,
      imageUrl: true,
      organizerId: true,
    },
  });

  if (!club) {
    notFound();
  }

  // Require organizer access
  if (club.organizerId !== dbUser.id) {
    redirect(`/clubs/${clubId}`);
  }

  // Fetch members for dev tools (only non-organizer members)
  const memberships = await prisma.membership.findMany({
    where: {
      clubId,
      role: "member",
    },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true,
        },
      },
    },
  });

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/clubs/${clubId}`} className="hover:underline">
              {club.name}
            </Link>
            <span>/</span>
            <span>Settings</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold">Club Settings</h1>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/clubs/${clubId}`}>Back to Club</Link>
        </Button>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Club Details</CardTitle>
          <CardDescription>Update your club information.</CardDescription>
        </CardHeader>
        <CardContent>
          <ClubForm
            mode="edit"
            clubId={clubId}
            initialData={{
              name: club.name,
              description: club.description,
              imageUrl: club.imageUrl,
            }}
          />
        </CardContent>
      </Card>

      {/* Dev Tools */}
      {isDev && memberships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Dev Tools
              <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-normal text-yellow-800">
                Development Only
              </span>
            </CardTitle>
            <CardDescription>
              Toggle member status for testing access rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {memberships.map((membership) => (
              <MemberCard
                key={membership.id}
                id={membership.user.id}
                name={membership.user.name}
                avatarUrl={membership.user.avatarUrl}
                role={membership.role}
                status={membership.status}
                joinedAt={membership.createdAt}
                email={membership.user.email}
                toggleComponent={
                  <MembershipToggle
                    clubId={clubId}
                    userId={membership.user.id}
                    currentStatus={membership.status}
                  />
                }
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete this club and all its data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteClubButton clubId={clubId} clubName={club.name} />
        </CardContent>
      </Card>
    </div>
  );
}
