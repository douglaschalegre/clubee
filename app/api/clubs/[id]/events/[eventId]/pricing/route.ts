import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import { eventPricingSchema } from "@/lib/validations/event";
import { createEventProduct, updateEventPrice } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

/**
 * POST /api/clubs/[id]/events/[eventId]/pricing
 * Set or update event pricing (organizer only).
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: clubId, eventId } = await context.params;
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    return jsonError("Não autorizado", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, stripeConnectAccountId: true, stripeConnectChargesEnabled: true },
  });

  if (!dbUser) {
    return jsonError("Não autorizado", 401);
  }

  const rateLimitResponse = checkRateLimit({
    request,
    identifier: dbUser.id,
    limit: 60,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Verify user is organizer
  const club = await prisma.club.findFirst({
    where: { id: clubId, organizerId: dbUser.id },
    select: { id: true },
  });

  if (!club) {
    return jsonError("Apenas organizadores podem definir preços", 403);
  }

  // Get event
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: {
      id: true,
      title: true,
      stripeProductId: true,
      stripePriceId: true,
      priceCents: true,
      rsvps: {
        where: { status: "going" },
        select: { id: true },
      },
    },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("JSON inválido", 400);
  }

  const validation = eventPricingSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(validation.error.issues[0].message, 400);
  }

  const { priceCents } = validation.data;

  // Block price changes if there are confirmed RSVPs
  if (event.rsvps.length > 0) {
    return jsonError(
      "Não é possível alterar o preço depois de RSVPs confirmados",
      400
    );
  }

  // Require Stripe Connect for paid events
  if (priceCents && priceCents > 0) {
    if (!dbUser.stripeConnectAccountId || !dbUser.stripeConnectChargesEnabled) {
      return jsonError(
        "Configure sua conta Stripe Connect antes de criar eventos pagos",
        400
      );
    }
  }

  try {
    // Handle free event (null or 0)
    if (!priceCents || priceCents === 0) {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          priceCents: null,
          stripeProductId: null,
          stripePriceId: null,
        },
      });

      return jsonSuccess({
        message: "Evento definido como gratuito",
        priceCents: null,
      });
    }

    // Handle paid event
    let productId = event.stripeProductId;
    let priceId: string;

    if (!productId || !event.stripePriceId) {
      // Create new product and price
      const { product, price } = await createEventProduct(
        event.title,
        priceCents
      );
      productId = product.id;
      priceId = price.id;
    } else {
      // Update existing price
      const newPrice = await updateEventPrice(
        productId,
        event.stripePriceId,
        priceCents
      );
      priceId = newPrice.id;
    }

    // Update event in database
    await prisma.event.update({
      where: { id: eventId },
      data: {
        priceCents,
        stripeProductId: productId,
        stripePriceId: priceId,
      },
    });

    await logAuditEvent({
      actorId: dbUser.id,
      action: "event.pricing_update",
      targetType: "event",
      targetId: eventId,
      metadata: {
        clubId,
        priceCents,
      },
      request,
    });

    return jsonSuccess({
      message: "Preço do evento atualizado",
      priceCents,
      stripeProductId: productId,
      stripePriceId: priceId,
    });
  } catch (error) {
    console.error("Falha ao atualizar preço do evento:", error);
    return jsonError("Falha ao atualizar preço do evento", 500);
  }
}
