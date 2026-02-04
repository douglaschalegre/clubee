import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

/**
 * GET /api/clubs/[id]/events/[eventId]/requests
 * List all pending approval requests for an event (organizer only).
 */
export async function GET(_request: Request, context: RouteContext) {
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

  // Verify user is organizer
  const club = await prisma.club.findFirst({
    where: { id: clubId, organizerId: dbUser.id },
    select: { id: true },
  });

  if (!club) {
    return jsonError("Apenas organizadores podem ver solicitações", 403);
  }

  // Verify event exists
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: { id: true },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  try {
    // Get all pending approval requests
    const requests = await prisma.eventRsvp.findMany({
      where: {
        eventId,
        status: "pending_approval",
      },
      select: {
        userId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return jsonSuccess({ requests });
  } catch (error) {
    console.error("Falha ao buscar solicitações:", error);
    return jsonError("Falha ao buscar solicitações", 500);
  }
}
