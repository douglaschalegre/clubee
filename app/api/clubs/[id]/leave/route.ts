import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/leave
 * Cancel membership and deactivate access.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  const rateLimitResponse = checkRateLimit({
    request,
    identifier: user.id,
    limit: 60,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, organizerId: true },
  });

  if (!club) {
    return jsonError("Clube não encontrado", 404);
  }

  if (club.organizerId === user.id) {
    return jsonError("O organizador não pode sair do próprio clube", 400);
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_clubId: { userId: user.id, clubId },
    },
  });

  if (!membership) {
    return jsonError("Assinatura não encontrada", 404);
  }

  let cancellationError: unknown = null;

  if (membership.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(membership.stripeSubscriptionId);
    } catch (error) {
      cancellationError = error;
      console.error("Falha ao cancelar a assinatura:", error);
    }
  }

  try {
    await prisma.membership.delete({
      where: { id: membership.id },
    });

    if (cancellationError) {
      return jsonSuccess(
        { deleted: true, warning: "Falha ao cancelar a assinatura" },
        200
      );
    }

    return jsonSuccess({ deleted: true }, 200);
  } catch (error) {
    console.error("Falha ao sair do clube:", error);
    return jsonError("Falha ao sair do clube", 500);
  }
}
