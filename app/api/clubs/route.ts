import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { createClubSchema } from "@/lib/validations/club";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

/**
 * GET /api/clubs
 * List all clubs (public).
 */
export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        organizerId: true,
        createdAt: true,
      },
    });

    return jsonSuccess({ clubs });
  } catch {
    return jsonError("Falha ao buscar clubes", 500);
  }
}

/**
 * POST /api/clubs
 * Create a new club (authenticated user becomes organizer).
 */
export async function POST(request: Request) {
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

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const validation = createClubSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const { name, description, imageUrl, membershipPrice } = validation.data;

  // Convert price from R$ to cents
  const membershipPriceCents = membershipPrice
    ? Math.round(membershipPrice * 100)
    : null;

  try {
    // Create club and organizer membership in a transaction
    const club = await prisma.$transaction(async (tx) => {
      // Create the club
      const newClub = await tx.club.create({
        data: {
          name,
          description,
          imageUrl,
          membershipPriceCents,
          organizerId: user.id,
        },
      });

      // Create organizer membership
      await tx.membership.create({
        data: {
          userId: user.id,
          clubId: newClub.id,
          role: "organizer",
          status: "active",
        },
      });

      return newClub;
    });

    await logAuditEvent({
      actorId: user.id,
      action: "club.create",
      targetType: "club",
      targetId: club.id,
      metadata: {
        membershipPriceCents,
      },
      request,
    });

    return jsonSuccess({ club }, 201);
  } catch {
    return jsonError("Falha ao criar clube", 500);
  }
}
