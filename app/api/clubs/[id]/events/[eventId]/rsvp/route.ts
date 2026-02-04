import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import {
  RESERVED_RSVP_STATUSES,
  isReservedStatus,
} from "@/lib/event-capacity";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id: clubId, eventId } = await context.params;
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    return jsonError("Não autorizado", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });

  if (!dbUser) {
    return jsonError("Não autorizado", 401);
  }

  // Fetch event with pricing and approval settings
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: {
      id: true,
      priceCents: true,
      requiresApproval: true,
      maxCapacity: true,
      club: {
        select: {
          membershipPriceCents: true,
          organizerId: true,
        },
      },
    },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  const isPaidEvent = event.priceCents && event.priceCents > 0;
  const needsApproval = event.requiresApproval;
  const isOrganizer = event.club.organizerId === dbUser.id;
  const isPaidClub =
    event.club.membershipPriceCents && event.club.membershipPriceCents > 0;
  const maxCapacity = event.maxCapacity;

  // Organizers can't RSVP to their own events
  if (isOrganizer) {
    return jsonError("Organizadores não podem responder aos próprios eventos", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const status = (body as { status?: string })?.status;

  if (!status || !["going", "not_going"].includes(status)) {
    return jsonError("Status deve ser 'going' ou 'not_going'", 400);
  }

  // Handle "not_going" (always simple)
  if (status === "not_going") {
    try {
      const rsvp = await prisma.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId: dbUser.id } },
        create: { eventId, userId: dbUser.id, status },
        update: { status },
      });
      return jsonSuccess({ rsvp, status: "not_going" });
    } catch (error) {
      console.error("Falha ao atualizar RSVP:", error);
      return jsonError("Falha ao atualizar RSVP", 500);
    }
  }

  // Handle "going" based on event configuration

  // Check if event requires membership (free events in paid clubs)
  const requiresMembership = !isPaidEvent && isPaidClub;

  if (requiresMembership) {
    const membership = await prisma.membership.findUnique({
      where: { userId_clubId: { userId: dbUser.id, clubId } },
    });

    if (!membership || membership.status !== "active") {
      return jsonError(
        "Assinatura ativa obrigatória para eventos gratuitos",
        403
      );
    }
  }

  try {
    type RsvpClient = Pick<typeof prisma, "eventRsvp">;

    const upsertGoing = async (client: RsvpClient) => {
      if (needsApproval && isPaidEvent) {
        const rsvp = await client.eventRsvp.upsert({
          where: { eventId_userId: { eventId, userId: dbUser.id } },
          create: {
            eventId,
            userId: dbUser.id,
            status: "pending_approval",
          },
          update: {
            status: "pending_approval",
          },
        });
        return {
          rsvp,
          requiresApproval: true,
          requiresPayment: true,
        };
      }

      if (needsApproval) {
        const rsvp = await client.eventRsvp.upsert({
          where: { eventId_userId: { eventId, userId: dbUser.id } },
          create: {
            eventId,
            userId: dbUser.id,
            status: "pending_approval",
          },
          update: {
            status: "pending_approval",
          },
        });
        return {
          rsvp,
          requiresApproval: true,
        };
      }

      if (isPaidEvent) {
        const rsvp = await client.eventRsvp.upsert({
          where: { eventId_userId: { eventId, userId: dbUser.id } },
          create: {
            eventId,
            userId: dbUser.id,
            status: "pending_payment",
          },
          update: {
            status: "pending_payment",
          },
        });
        return {
          rsvp,
          requiresPayment: true,
        };
      }

      const rsvp = await client.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId: dbUser.id } },
        create: {
          eventId,
          userId: dbUser.id,
          status: "going",
        },
        update: {
          status: "going",
        },
      });
      return { rsvp };
    };

    const shouldCheckCapacity =
      maxCapacity !== null && maxCapacity !== undefined;

    if (shouldCheckCapacity) {
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.eventRsvp.findUnique({
          where: { eventId_userId: { eventId, userId: dbUser.id } },
          select: { status: true },
        });
        const hasReserved = isReservedStatus(existing?.status ?? null);

        if (!hasReserved) {
          const reservedCount = await tx.eventRsvp.count({
            where: {
              eventId,
              status: { in: RESERVED_RSVP_STATUSES },
            },
          });

          if (reservedCount >= maxCapacity) {
            return { error: "full" as const };
          }
        }

        return { data: await upsertGoing(tx) };
      });

      if ("error" in result) {
        return jsonError("Evento lotado", 409);
      }

      return jsonSuccess(result.data);
    }

    const payload = await upsertGoing(prisma);
    return jsonSuccess(payload);
  } catch (error) {
    console.error("Falha ao atualizar RSVP:", error);
    return jsonError("Falha ao atualizar RSVP", 500);
  }
}
