import { prisma } from "@/lib/db";
import {
  jsonError,
  jsonSuccess,
  requireAuth,
  isErrorResponse,
  requireOrganizer,
} from "@/lib/api-utils";
import { updateMembershipStatusSchema } from "@/lib/validations/club";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string; userId: string }>;
}

/**
 * PATCH /api/clubs/[id]/members/[userId]/status
 * Toggle membership status (dev-only).
 * Used for testing access rules without Stripe integration.
 */
export async function PATCH(request: Request, context: RouteContext) {
  // Only allow in development
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.ENABLE_DEV_TOOLS !== "true"
  ) {
    return jsonError("Não disponível em produção", 403);
  }

  const { id: clubId, userId } = await context.params;

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

  const validation = updateMembershipStatusSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const { status } = validation.data;

  try {
    // Check membership exists
    const existing = await prisma.membership.findUnique({
      where: {
        userId_clubId: { userId, clubId },
      },
    });

    if (!existing) {
      return jsonError("Assinatura não encontrada", 404);
    }

    // Update status
    const membership = await prisma.membership.update({
      where: {
        userId_clubId: { userId, clubId },
      },
      data: { status },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "membership.dev_status_update",
      targetType: "club",
      targetId: clubId,
      metadata: {
        targetUserId: userId,
        status,
      },
      request,
    });

    return jsonSuccess({ membership });
  } catch {
    return jsonError("Falha ao atualizar o status da assinatura", 500);
  }
}
