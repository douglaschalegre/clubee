import { notFound, redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { Breadcrumb } from "@/components/breadcrumb";
import { EventRegistrationsDashboard } from "@/components/event-registrations-dashboard";

interface PageProps {
  params: Promise<{ id: string; eventId: string }>;
}

export default async function EventRegistrationsPage({ params }: PageProps) {
  const { id: clubId, eventId } = await params;
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, profileCompleted: true },
  });

  if (!dbUser) {
    redirect("/auth/login");
  }

  if (!dbUser.profileCompleted) {
    const returnTo = `/clubs/${clubId}/events/${eventId}/registrations`;
    redirect(`/profile?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true, organizerId: true },
  });

  if (!club) {
    notFound();
  }

  if (club.organizerId !== dbUser.id) {
    redirect(`/clubs/${clubId}`);
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: {
      id: true,
      title: true,
      startsAt: true,
      timezone: true,
      priceCents: true,
      requiresApproval: true,
      maxCapacity: true,
    },
  });

  if (!event) {
    notFound();
  }

  const rsvps = await prisma.eventRsvp.findMany({
    where: { eventId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      status: true,
      createdAt: true,
      approvedAt: true,
      rejectedAt: true,
      rejectionReason: true,
      paidAt: true,
      paidAmountCents: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
  });

  const eventData = {
    ...event,
    startsAt: event.startsAt.toISOString(),
  };

  const rsvpData = rsvps.map((rsvp) => ({
    id: rsvp.id,
    status: rsvp.status,
    createdAt: rsvp.createdAt.toISOString(),
    approvedAt: rsvp.approvedAt ? rsvp.approvedAt.toISOString() : null,
    rejectedAt: rsvp.rejectedAt ? rsvp.rejectedAt.toISOString() : null,
    rejectionReason: rsvp.rejectionReason,
    paidAt: rsvp.paidAt ? rsvp.paidAt.toISOString() : null,
    paidAmountCents: rsvp.paidAmountCents,
    updatedAt: rsvp.updatedAt.toISOString(),
    user: {
      id: rsvp.user.id,
      name: rsvp.user.name,
      email: rsvp.user.email,
      phone: rsvp.user.phone,
      avatarUrl: rsvp.user.avatarUrl,
    },
  }));

  return (
    <div className="space-y-8">
      <Breadcrumb
        items={[
          { label: "Clubes", href: "/clubs" },
          { label: club.name, href: `/clubs/${clubId}` },
          { label: "Inscrições" },
        ]}
      />

      <EventRegistrationsDashboard
        clubId={clubId}
        event={eventData}
        rsvps={rsvpData}
      />
    </div>
  );
}
