import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOrganizer,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { updateClubSchema } from "@/lib/validations/club";

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

    return jsonSuccess({ club });
  } catch {
    return jsonError("Falha ao atualizar clube", 500);
  }
}

/**
 * DELETE /api/clubs/[id]
 * Delete club (organizer only). Cascades memberships.
 */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  // Require authentication
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  // Require organizer access
  const orgCheck = await requireOrganizer(user.id, clubId);
  if (isErrorResponse(orgCheck)) {
    return orgCheck;
  }

  try {
    await prisma.club.delete({
      where: { id: clubId },
    });

    return jsonSuccess({ deleted: true });
  } catch {
    return jsonError("Falha ao excluir clube", 500);
  }
}
