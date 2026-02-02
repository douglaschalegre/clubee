import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/breadcrumb";
import { MyClubsView } from "@/components/my-clubs-view";

export default async function MyClubsPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  const [organizingClubs, memberMemberships] = await Promise.all([
    prisma.club.findMany({
      where: { organizerId: dbUser.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        _count: { select: { memberships: true } },
      },
    }),
    prisma.membership.findMany({
      where: { userId: dbUser.id, role: "member" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        stripeSubscriptionId: true,
        currentPeriodEnd: true,
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            _count: { select: { memberships: true } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <Breadcrumb items={[{ label: "Meus clubes" }]} />
      <MyClubsView
        organizingClubs={organizingClubs}
        memberMemberships={memberMemberships.map((membership) => ({
          ...membership,
          currentPeriodEnd: membership.currentPeriodEnd
            ? membership.currentPeriodEnd.toISOString()
            : null,
        }))}
      />
    </div>
  );
}
