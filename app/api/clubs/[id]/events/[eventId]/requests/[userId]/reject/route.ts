import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { approvalActionSchema } from "@/lib/validations/event";

interface RouteContext {
  params: Promise<{ id: string; eventId: string; userId: string }>;
}

/**
 * POST /api/clubs/[id]/events/[eventId]/requests/[userId]/reject
 * Reject a user's request to attend an event (organizer only).
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

  // Verify user is organizer
  const club = await prisma.club.findFirst({
    where: { id: clubId, organizerId: dbUser.id },
    select: { id: true },
  });

  if (!club) {
    return jsonError("Apenas organizadores podem rejeitar solicitações", 403);
  }

  // Verify event exists
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: { id: true },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  // Parse optional rejection reason
  let body: unknown;
  let rejectionReason: string | undefined;
  try {
    body = await request.json();
    const validation = approvalActionSchema.safeParse(body);
    if (validation.success) {
      rejectionReason = validation.data.rejectionReason;
    }
  } catch {
    // Optional body, ignore if invalid
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

  try {
    // Update RSVP to rejected status
    const updatedRsvp = await prisma.eventRsvp.update({
      where: { id: rsvp.id },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason,
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

    return jsonSuccess({
      rsvp: updatedRsvp,
      message: "Solicitação rejeitada.",
    });
  } catch (error) {
    console.error("Falha ao rejeitar solicitação:", error);
    return jsonError("Falha ao rejeitar solicitação", 500);
  }
}
