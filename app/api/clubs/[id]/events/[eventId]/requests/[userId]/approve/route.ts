import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string; eventId: string; userId: string }>;
}

/**
 * POST /api/clubs/[id]/events/[eventId]/requests/[userId]/approve
 * Approve a user's request to attend an event (organizer only).
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: clubId, eventId, userId } = await context.params;
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

  const rateLimitResponse = checkRateLimit({
    request,
    identifier: dbUser.id,
    limit: 20,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Verify user is organizer
  const club = await prisma.club.findFirst({
    where: { id: clubId, organizerId: dbUser.id },
    select: { id: true },
  });

  if (!club) {
    return jsonError("Apenas organizadores podem aprovar solicitações", 403);
  }

  // Get event with pricing info
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: {
      id: true,
      priceCents: true,
    },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  // Find RSVP with pending_approval status
  const rsvp = await prisma.eventRsvp.findFirst({
    where: {
      eventId,
      userId,
      status: "pending_approval",
    },
  });

  if (!rsvp) {
    return jsonError("Solicitação não encontrada ou já processada", 404);
  }

  const isPaidEvent = event.priceCents && event.priceCents > 0;

  try {
    // Update RSVP status based on whether event is paid
    const updatedRsvp = await prisma.eventRsvp.update({
      where: { id: rsvp.id },
      data: {
        status: isPaidEvent ? "approved_pending_payment" : "going",
        approvedAt: new Date(),
        approvedById: dbUser.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await logAuditEvent({
      actorId: dbUser.id,
      action: "event.rsvp_approve",
      targetType: "event",
      targetId: eventId,
      metadata: {
        clubId,
        userId,
      },
      request,
    });

    return jsonSuccess({
      rsvp: updatedRsvp,
      message: isPaidEvent
        ? "Solicitação aprovada. Usuário deve completar o pagamento."
        : "Solicitação aprovada. Usuário confirmado.",
    });
  } catch (error) {
    console.error("Falha ao aprovar solicitação:", error);
    return jsonError("Falha ao aprovar solicitação", 500);
  }
}
