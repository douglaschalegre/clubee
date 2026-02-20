import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/join
 * Allows direct join for free clubs (no payment required).
 * For paid clubs, use the Stripe checkout endpoint instead.
 */
export async function POST(request: Request, context: RouteContext) {
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

  // Get club and verify it's free
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { membershipPriceCents: true },
  });

  if (!club) {
    return jsonError("Clube não encontrado", 404);
  }

  if (club.membershipPriceCents && club.membershipPriceCents > 0) {
    return jsonError("Use checkout para clubes pagos", 400);
  }

  try {
    // Create or reactivate membership
    const membership = await prisma.membership.upsert({
      where: { userId_clubId: { userId: user.id, clubId } },
      create: {
        userId: user.id,
        clubId,
        role: "member",
        status: "active",
      },
      update: { status: "active" },
    });

    return jsonSuccess({ membership });
  } catch (error) {
    console.error("Falha ao entrar no clube:", error);
    return jsonError("Falha ao entrar no clube", 500);
  }
}
