import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
  jsonSuccess,
  isClubOrganizer,
} from "@/lib/api-utils";
import { stripe } from "@/lib/stripe";

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

/**
 * DELETE /api/clubs/[id]/members/[userId]
 * Remove a member from the club (organizer only).
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id: clubId, userId: targetUserId } = await context.params;

  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  // Only organizers can remove members
  const isOrganizer = await isClubOrganizer(user.id, clubId);
  if (!isOrganizer) {
    return jsonError("Apenas organizadores podem remover membros", 403);
  }

  // Can't remove yourself (the organizer)
  if (targetUserId === user.id) {
    return jsonError("Você não pode remover a si mesmo do clube", 400);
  }

  // Find the membership
  const membership = await prisma.membership.findUnique({
    where: {
      userId_clubId: { userId: targetUserId, clubId },
    },
  });

  if (!membership) {
    return jsonError("Assinatura não encontrada", 404);
  }

  // Cancel Stripe subscription if exists
  if (membership.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(membership.stripeSubscriptionId);
    } catch (error) {
      console.error("Falha ao cancelar a assinatura:", error);
      // Continue with deletion even if Stripe fails
    }
  }

  // Delete the membership
  try {
    await prisma.membership.delete({
      where: { id: membership.id },
    });

    return jsonSuccess({ deleted: true });
  } catch (error) {
    console.error("Falha ao remover membro:", error);
    return jsonError("Falha ao remover membro", 500);
  }
}
