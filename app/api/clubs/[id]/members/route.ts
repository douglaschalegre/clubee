import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireActiveMembership,
  isClubOrganizer,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clubs/[id]/members
 * List club members.
 * - Requires active membership.
 * - Organizer sees full data (email, phone).
 * - Member sees limited data (name, avatar only).
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  // Require authentication
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  // Require active membership
  const membershipResult = await requireActiveMembership(user.id, clubId);
  if (isErrorResponse(membershipResult)) {
    return membershipResult;
  }

  // Check if requester is organizer
  const isOrganizer = await isClubOrganizer(user.id, clubId);

  try {
    const memberships = await prisma.membership.findMany({
      where: { clubId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            // Only include sensitive data for organizers
            ...(isOrganizer && {
              email: true,
              phone: true,
            }),
          },
        },
      },
    });

    // Transform to flat member objects
    const members = memberships.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      status: m.status,
      joinedAt: m.createdAt,
      ...(isOrganizer && {
        email: (m.user as { email?: string }).email,
        phone: (m.user as { phone?: string }).phone,
      }),
    }));

    return jsonSuccess({ members, isOrganizer });
  } catch {
    return jsonError("Failed to fetch members", 500);
  }
}
