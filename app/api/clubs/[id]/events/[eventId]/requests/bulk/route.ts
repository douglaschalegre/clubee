import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { bulkApprovalActionSchema } from "@/lib/validations/event";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

/**
 * POST /api/clubs/[id]/events/[eventId]/requests/bulk
 * Bulk approve/reject pending approval requests (organizer only).
 */
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

  // Verify user is organizer
  const club = await prisma.club.findFirst({
    where: { id: clubId, organizerId: dbUser.id },
    select: { id: true },
  });

  if (!club) {
    return jsonError("Apenas organizadores podem aprovar solicitações", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const validation = bulkApprovalActionSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const { action, userIds, rejectionReason } = validation.data;

  // Get event with pricing info
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: { id: true, priceCents: true },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  const isPaidEvent = event.priceCents && event.priceCents > 0;

  try {
    if (action === "approve") {
      const result = await prisma.eventRsvp.updateMany({
        where: {
          eventId,
          userId: { in: userIds },
          status: "pending_approval",
        },
        data: {
          status: isPaidEvent ? "approved_pending_payment" : "going",
          approvedAt: new Date(),
          approvedById: dbUser.id,
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      return jsonSuccess({ updatedCount: result.count, status: "approved" });
    }

    const result = await prisma.eventRsvp.updateMany({
      where: {
        eventId,
        userId: { in: userIds },
        status: "pending_approval",
      },
      data: {
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: rejectionReason || null,
        approvedAt: null,
        approvedById: null,
      },
    });

    return jsonSuccess({ updatedCount: result.count, status: "rejected" });
  } catch (error) {
    console.error("Falha ao processar aprovações em lote:", error);
    return jsonError("Falha ao processar aprovações", 500);
  }
}
