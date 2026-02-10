import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { stripe } from "@/lib/stripe";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    return jsonError("Nao autorizado", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true },
  });

  if (!dbUser) {
    return jsonError("Nao autorizado", 401);
  }

  const rateLimitResponse = checkRateLimit({
    request,
    identifier: dbUser.id,
    limit: 60,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Verify club and current ownership
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { organizerId: true },
  });

  if (!club) {
    return jsonError("Clube nao encontrado", 404);
  }

  if (club.organizerId !== dbUser.id) {
    return jsonError("Acesso de organizador obrigatorio", 403);
  }

  // Parse body
  let body: { newOwnerUserId: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON invalido", 400);
  }

  const { newOwnerUserId } = body;

  if (!newOwnerUserId) {
    return jsonError("Novo organizador e obrigatorio", 400);
  }

  if (newOwnerUserId === dbUser.id) {
    return jsonError("Voce ja e o organizador", 400);
  }

  // Verify new owner is a member
  const newOwnerMembership = await prisma.membership.findUnique({
    where: {
      userId_clubId: { userId: newOwnerUserId, clubId },
    },
  });

  if (!newOwnerMembership) {
    return jsonError("O novo organizador deve ser membro do clube", 400);
  }

  // If new owner has a subscription, cancel it
  if (newOwnerMembership.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.cancel(newOwnerMembership.stripeSubscriptionId);
    } catch (error) {
      console.error("Falha ao cancelar assinatura do novo organizador:", error);
      // Continue anyway, don't block transfer
    }
  }

  try {
    // Transaction: update club owner, swap roles
    await prisma.$transaction([
      // Update club organizer
      prisma.club.update({
        where: { id: clubId },
        data: { organizerId: newOwnerUserId },
      }),
      // Demote current organizer to member AND set inactive (must resubscribe)
      prisma.membership.update({
        where: { userId_clubId: { userId: dbUser.id, clubId } },
        data: { 
          role: "member",
          status: "inactive",
          stripeSubscriptionId: null, // Ensure no stale sub ID
          currentPeriodEnd: null 
        },
      }),
      // Promote new owner to organizer (active, no sub needed)
      prisma.membership.update({
        where: { userId_clubId: { userId: newOwnerUserId, clubId } },
        data: { 
          role: "organizer",
          status: "active",
          stripeSubscriptionId: null, // Clear sub ID as they are now owner
          currentPeriodEnd: null 
        },
      }),
    ]);

    await logAuditEvent({
      actorId: dbUser.id,
      action: "club.transfer_ownership",
      targetType: "club",
      targetId: clubId,
      metadata: {
        newOwnerUserId,
      },
      request,
    });

    return jsonSuccess({ transferred: true });
  } catch (error) {
    console.error("Falha ao transferir propriedade:", error);
    return jsonError("Falha ao transferir propriedade", 500);
  }
}
