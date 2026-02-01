import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { createClubSchema } from "@/lib/validations/club";

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
    return jsonError("Failed to fetch clubs", 500);
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

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const validation = createClubSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const { name, description, imageUrl } = validation.data;

  try {
    // Create club and organizer membership in a transaction
    const club = await prisma.$transaction(async (tx) => {
      // Create the club
      const newClub = await tx.club.create({
        data: {
          name,
          description,
          imageUrl,
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

    return jsonSuccess({ club }, 201);
  } catch {
    return jsonError("Failed to create club", 500);
  }
}
