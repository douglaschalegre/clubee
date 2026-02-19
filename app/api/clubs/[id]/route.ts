import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOrganizer,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { updateClubSchema } from "@/lib/validations/club";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";
import { promiseAllLimit } from "@/lib/concurrency";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clubs/[id]
 * Get club details with organizer info (public).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const club = await prisma.club.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        organizer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!club) {
      return jsonError("Clube não encontrado", 404);
    }

    return jsonSuccess({ club });
  } catch {
    return jsonError("Falha ao buscar clube", 500);
  }
}

/**
 * PATCH /api/clubs/[id]
 * Update club (organizer only).
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  // Require authentication
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

  // Require organizer access
  const orgCheck = await requireOrganizer(user.id, clubId);
  if (isErrorResponse(orgCheck)) {
    return orgCheck;
  }

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const validation = updateClubSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const { name, description, imageUrl } = validation.data;

  try {
    const club = await prisma.club.update({
      where: { id: clubId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "club.update",
      targetType: "club",
      targetId: clubId,
      metadata: {
        name,
        description,
        imageUrl,
      },
      request,
    });

    return jsonSuccess({ club });
  } catch {
    return jsonError("Falha ao atualizar clube", 500);
  }
}

/**
 * DELETE /api/clubs/[id]
 * Delete club (organizer only). Cascades memberships.
 */
export async function DELETE(request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  // Require authentication
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

  // Require organizer access
  const orgCheck = await requireOrganizer(user.id, clubId);
  if (isErrorResponse(orgCheck)) {
    return orgCheck;
  }

  try {
    // Cancel all active subscriptions for this club
    const membershipsWithSubs = await prisma.membership.findMany({
      where: {
        clubId,
        stripeSubscriptionId: { not: null },
      },
      select: { stripeSubscriptionId: true },
    });

    await promiseAllLimit(membershipsWithSubs, 5, async (m) => {
      if (m.stripeSubscriptionId) {
        try {
          await stripe.subscriptions.cancel(m.stripeSubscriptionId);
        } catch (error) {
          console.error(
            `Falha ao cancelar assinatura ${m.stripeSubscriptionId}:`,
            error
          );
        }
      }
    });

    await prisma.club.delete({
      where: { id: clubId },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "club.delete",
      targetType: "club",
      targetId: clubId,
      request,
    });

    return jsonSuccess({ deleted: true });
  } catch {
    return jsonError("Falha ao excluir clube", 500);
  }
}
