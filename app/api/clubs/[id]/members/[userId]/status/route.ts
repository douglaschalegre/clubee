import { prisma } from "@/lib/db";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { updateMembershipStatusSchema } from "@/lib/validations/club";

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
  if (process.env.NODE_ENV !== "development") {
    return jsonError("Não disponível em produção", 403);
  }

  const { id: clubId, userId } = await context.params;

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

    return jsonSuccess({ membership });
  } catch {
    return jsonError("Falha ao atualizar o status da assinatura", 500);
  }
}
