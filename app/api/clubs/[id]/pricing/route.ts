import { prisma } from "@/lib/db";
import {
  requireAuth,
  requireOrganizer,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";
import { createClubProduct, updateClubPrice } from "@/lib/stripe";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/pricing
 * Set or update club membership pricing (organizer only).
 * Body: { priceCents: number }
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: clubId } = await context.params;

  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  const orgCheck = await requireOrganizer(user.id, clubId);
  if (isErrorResponse(orgCheck)) {
    return orgCheck;
  }

  // Validate connect status
  if (user.stripeConnectStatus !== "active") {
    return jsonError(
      "Configure sua conta Stripe Connect antes de definir preços",
      400
    );
  }

  // Parse body
  let priceCents: number;
  try {
    const body = await request.json();
    priceCents = body.priceCents;
    if (!priceCents || typeof priceCents !== "number" || priceCents < 100) {
      return jsonError("Preço mínimo é R$ 1,00 (100 centavos)", 400);
    }
  } catch {
    return jsonError("Corpo da requisição inválido", 400);
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
    let stripePriceId: string;
    let stripeProductId: string;

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
