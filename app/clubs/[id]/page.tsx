import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { generateClubMetadata, generateEventMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubAvatar } from "@/components/club-avatar";
import { MembershipStatusBadge } from "@/components/membership-status-badge";
import { LeaveButton } from "@/components/leave-button";
import { Breadcrumb } from "@/components/breadcrumb";
import { ClubEventsSection } from "@/components/club-events-section";
import {
  Users,
  Settings,
  Crown,
  Sparkles,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ event?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { event: eventId } = await searchParams;

  // Fetch club with organizer info
  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      organizer: {
        select: { name: true },
      },
    },
  });

  // If club not found, return basic metadata (Next.js will show 404)
  if (!club) {
    return {
      title: "Clube não encontrado | Clubee",
      description: "Este clube não existe ou foi removido.",
    };
  }

  // If event parameter is present, fetch event and return event metadata
  if (eventId) {
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        clubId: id,
      },
    });

    // If event found, generate event metadata
    if (event) {
      return generateEventMetadata(event, club);
    }
  }

  // Return club metadata (default case or if event not found)
  return generateClubMetadata(club);
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
          stripeConnectStatus: true,
        },
      },
      _count: {
        select: { memberships: true },
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
  const canViewEventDetails = isOrganizer || isActiveMember;
  const canAcceptPayments =
    club.organizer.stripeConnectStatus === "active" && !!club.stripePriceId;

  const events = await prisma.event.findMany({
    where: { clubId: id },
    orderBy: { startsAt: "asc" },
    include: {
      _count: { select: { rsvps: true } },
      createdBy: { select: { id: true, name: true, avatarUrl: true } },
      rsvps: dbUser?.id
        ? {
            where: { userId: dbUser.id },
            select: { status: true },
          }
        : false,
    },
  });

  const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[{ label: "Clubes", href: "/clubs" }, { label: club.name }]}
      />

      {/* Club Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-card shadow-sm">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-amber/5" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-amber/10 blur-3xl" />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="shrink-0">
              <ClubAvatar
                name={club.name}
                imageUrl={club.imageUrl}
                size="xl"
                className="ring-4 ring-background shadow-lg"
              />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-4">
              {/* Title and badges */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {isOrganizer && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/30 bg-primary/5 text-primary hover:bg-primary/20"
                    >
                      <Crown className="h-3 w-3" />
                      Organizador
                    </Badge>
                  )}
                  {membership && (
                    <MembershipStatusBadge status={membership.status} />
                  )}
                </div>

                <h1
                  className="text-3xl font-bold tracking-tight sm:text-4xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {club.name}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {club._count.memberships}{" "}
                    {club._count.memberships === 1 ? "membro" : "membros"}
                  </span>
                  <span>
                    Organizado por{" "}
                    <span className="font-medium text-foreground">
                      {club.organizer.name}
                    </span>
                  </span>
                </div>
              </div>

              {/* Description */}
              {club.description && (
                <p className="max-w-2xl text-muted-foreground leading-relaxed">
                  {club.description}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!session ? (
                  <Button
                    asChild
                    className="gap-2 shadow-honey transition-all hover:shadow-honey-lg"
                  >
                    <a href="/auth/login">
                      <Sparkles className="h-4 w-4" />
                      Entrar para participar
                    </a>
                  </Button>
                ) : !isMember ? (
                  canAcceptPayments ? (
                    <Button
                      asChild
                      className="group gap-2 shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.02]"
                    >
                      <Link href={`/clubs/${id}/join`}>
                        <Sparkles className="h-4 w-4" />
                        {club.membershipPriceCents
                          ? `Participar - ${(club.membershipPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/mês`
                          : "Participar do clube"}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled variant="secondary" className="gap-2">
                      Pagamentos ainda não configurados
                    </Button>
                  )
                ) : isActiveMember ? (
                  <Button asChild className="gap-2">
                    <Link href={`/clubs/${id}/members`}>
                      <Users className="h-4 w-4" />
                      Ver membros
                    </Link>
                  </Button>
                ) : (
                  <Button variant="secondary" disabled className="gap-2">
                    Assinatura inativa
                  </Button>
                )}

                {isMember && !isOrganizer && <LeaveButton clubId={id} />}

                {isOrganizer && (
                  <Button variant="outline" asChild className="gap-2">
                    <Link href={`/clubs/${id}/settings`}>
                      <Settings className="h-4 w-4" />
                      Configurações
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Organizer banner: payment setup needed */}
      {isOrganizer && !canAcceptPayments && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-amber-800 dark:text-amber-200">
              Pagamentos não configurados.
            </span>{" "}
            <span className="text-amber-700 dark:text-amber-300">
              Configure o Stripe e defina um preço para que membros possam
              participar.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link href={`/clubs/${id}/settings`}>Configurar</Link>
          </Button>
        </div>
      )}

      <ClubEventsSection
        clubId={id}
        events={events.map((event) => ({
          id: event.id,
          title: event.title,
          description: event.description,
          startsAt: event.startsAt,
          timezone: event.timezone,
          locationType: event.locationType,
          locationValue: event.locationValue,
          rsvpCount: event._count.rsvps,
          rsvpStatus: event.rsvps?.[0]?.status ?? null,
          createdBy: event.createdBy ?? null,
        }))}
        isOrganizer={isOrganizer}
        canViewEventDetails={canViewEventDetails}
        mapApiKey={mapApiKey}
        isLoggedIn={!!session}
      />
    </div>
  );
}
