import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOrganizer,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { createClubProduct, updateClubPrice } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/pricing
 * Set or update club membership pricing (organizer only).
 * Body: { price: number | null } (in R$, e.g., 29.90)
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

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

  // Parse body
  let price: number | null;
  let priceCents: number | null;
  try {
    const body = await request.json();
    price = body.price ?? body.priceCents; // Support both formats temporarily

    // Handle legacy priceCents format
    if (body.priceCents !== undefined && body.price === undefined) {
      priceCents = body.priceCents;
    } else if (price === null || price === 0) {
      // Free club
      priceCents = null;
    } else {
      // Convert R$ to cents
      priceCents = Math.round(price * 100);
      if (priceCents < 100) {
        return jsonError("Preço mínimo é R$ 1,00", 400);
      }
    }
  } catch {
    return jsonError("Corpo da requisição inválido", 400);
  }

  // Validate Stripe Connect only if setting a paid price
  if (priceCents && priceCents > 0 && user.stripeConnectStatus !== "active") {
    return jsonError(
      "Configure sua conta Stripe Connect antes de definir preços",
      400
    );
  }

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      name: true,
      stripeProductId: true,
      stripePriceId: true,
    },
  });

  if (!club) {
    return jsonError("Clube não encontrado", 404);
  }

  try {
    let stripePriceId: string | null = null;
    let stripeProductId: string | null = null;

    // If setting to free, clear Stripe fields
    if (!priceCents || priceCents === 0) {
      const updated = await prisma.club.update({
        where: { id: clubId },
        data: {
          stripePriceId: null,
          stripeProductId: null,
          membershipPriceCents: null,
        },
      });

      await logAuditEvent({
        actorId: user.id,
        action: "club.pricing_update",
        targetType: "club",
        targetId: clubId,
        metadata: {
          membershipPriceCents: null,
        },
        request,
      });

      return jsonSuccess({
        message: "Clube definido como gratuito",
        membershipPriceCents: null,
      });
    }

    // Setting a paid price
    if (club.stripeProductId && club.stripePriceId) {
      // Update existing: archive old price, create new one
      const newPrice = await updateClubPrice(
        club.stripeProductId,
        club.stripePriceId,
        priceCents
      );
      stripePriceId = newPrice.id;
      stripeProductId = club.stripeProductId;
    } else {
      // Create new product + price
      const { product, price } = await createClubProduct(
        club.name,
        priceCents
      );
      stripePriceId = price.id;
      stripeProductId = product.id;
    }

    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        stripePriceId,
        stripeProductId,
        membershipPriceCents: priceCents,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      action: "club.pricing_update",
      targetType: "club",
      targetId: clubId,
      metadata: {
        membershipPriceCents: priceCents,
      },
      request,
    });

    return jsonSuccess({
      stripePriceId: updated.stripePriceId,
      stripeProductId: updated.stripeProductId,
      membershipPriceCents: updated.membershipPriceCents,
    });
  } catch (error) {
    console.error("Erro ao configurar preço:", error);
    return jsonError("Falha ao configurar preço", 500);
  }
}
