import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/join
 * Allows direct join for free clubs (no payment required).
 * For paid clubs, use the Stripe checkout endpoint instead.
 */
export async function POST(_request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;
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
      where: { userId_clubId: { userId: dbUser.id, clubId } },
      create: {
        userId: dbUser.id,
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
