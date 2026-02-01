import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClubAvatar } from "@/components/club-avatar";
import { JoinButton } from "@/components/join-button";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function JoinClubPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth0.getSession();

  // Require login
  if (!session) {
    redirect("/auth/login");
  }

  // Fetch club
  const club = await prisma.club.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      organizer: {
        select: { name: true },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Check if already a member
  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });

  if (dbUser) {
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: { userId: dbUser.id, clubId: id },
      },
    });

    if (existingMembership) {
      // Already a member, redirect to club page
      redirect(`/clubs/${id}`);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <ClubAvatar name={club.name} imageUrl={club.imageUrl} size="lg" />
          </div>
          <CardTitle className="text-2xl">{club.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Organized by {club.organizer.name}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {club.description && (
            <p className="text-center text-muted-foreground">
              {club.description}
            </p>
          )}

          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-lg font-semibold">Membership Subscription</p>
            <p className="text-sm text-muted-foreground mt-1">
              Joining this club requires a paid subscription. You&apos;ll be
              redirected to our secure payment page.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <JoinButton clubId={id} />
            <Button variant="outline" asChild>
              <Link href={`/clubs/${id}`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
