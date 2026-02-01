import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { stripe } from "@/lib/stripe";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/leave
 * Cancel membership and deactivate access.
 */
export async function POST(_request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, organizerId: true },
  });

  if (!club) {
    return jsonError("Club not found", 404);
  }

  if (club.organizerId === user.id) {
    return jsonError("Organizer cannot leave their own club", 400);
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_clubId: { userId: user.id, clubId },
    },
  });

  if (!membership) {
    return jsonError("Membership not found", 404);
  }

  let cancellationError: unknown = null;

  if (membership.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(membership.stripeSubscriptionId);
    } catch (error) {
      cancellationError = error;
      console.error("Failed to cancel Stripe subscription:", error);
    }
  }

  try {
    await prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: "inactive",
      },
    });

    if (cancellationError) {
      return jsonSuccess(
        { status: "inactive", warning: "Subscription cancellation failed" },
        200
      );
    }

    return jsonSuccess({ status: "inactive" }, 200);
  } catch (error) {
    console.error("Failed to leave club:", error);
    return jsonError("Failed to leave club", 500);
  }
}
