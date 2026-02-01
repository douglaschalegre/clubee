import { prisma } from "@/lib/db";
import {
  requireAuth,
  getMembership,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/join
 * Join a club as a member (creates active membership).
 */
export async function POST(_request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  // Require authentication
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  // Check if club exists
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true },
  });

  if (!club) {
    return jsonError("Club not found", 404);
  }

  // Check if user is already a member
  const existingMembership = await getMembership(user.id, clubId);
  if (existingMembership) {
    return jsonError("Already a member of this club", 400);
  }

  try {
    // Create membership with role: member, status: active
    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        clubId,
        role: "member",
        status: "active",
      },
    });

    return jsonSuccess({ membership }, 201);
  } catch {
    return jsonError("Failed to join club", 500);
  }
}
