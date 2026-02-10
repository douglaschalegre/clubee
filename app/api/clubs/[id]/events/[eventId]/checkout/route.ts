import { prisma } from "@/lib/db";
import { auth0 } from "@/lib/auth0";
import { jsonError, jsonSuccess } from "@/lib/api-utils";
import {
  getOrCreateCustomer,
  createEventCheckoutSession,
  createEventProduct,
  createEventPrice,
} from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/urls";

interface RouteContext {
  params: Promise<{ id: string; eventId: string }>;
}

/**
 * POST /api/clubs/[id]/events/[eventId]/checkout
 * Create Stripe checkout session for event payment.
 */
export async function POST(request: Request, context: RouteContext) {
  const { id: clubId, eventId } = await context.params;
  const session = await auth0.getSession();

  if (!session?.user?.sub) {
    return jsonError("Não autorizado", 401);
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: {
      id: true,
      email: true,
      name: true,
      stripeCustomerId: true,
    },
  });

  if (!dbUser) {
    return jsonError("Não autorizado", 401);
  }

  const rateLimitResponse = checkRateLimit({
    request,
    identifier: dbUser.id,
    limit: 20,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Get event with pricing and organizer info
  const event = await prisma.event.findFirst({
    where: { id: eventId, clubId },
    select: {
      id: true,
      title: true,
      priceCents: true,
      stripeProductId: true,
      stripePriceId: true,
      club: {
        select: {
          name: true,
          organizer: {
            select: {
              stripeConnectAccountId: true,
              stripeConnectChargesEnabled: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    return jsonError("Evento não encontrado", 404);
  }

  if (!event.priceCents || event.priceCents <= 0) {
    return jsonError("Este evento é gratuito", 400);
  }

  // Check RSVP status
  const rsvp = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId, userId: dbUser.id } },
    select: { status: true },
  });

  if (!rsvp) {
    return jsonError("RSVP antes de realizar o pagamento", 400);
  }

  if (rsvp.status === "going") {
    return jsonError("Você já pagou por este evento", 400);
  }

  if (
    rsvp.status !== "pending_payment" &&
    rsvp.status !== "approved_pending_payment" &&
    rsvp.status !== "payment_failed"
  ) {
    return jsonError(
      `Não é possível pagar com status: ${rsvp.status}`,
      400
    );
  }

  let stripePriceId = event.stripePriceId;
  let stripeProductId = event.stripeProductId;

  if (!stripePriceId) {
    if (
      !event.club.organizer.stripeConnectChargesEnabled ||
      !event.club.organizer.stripeConnectAccountId
    ) {
      return jsonError("Pagamentos não configurados para este evento", 400);
    }

    try {
      if (stripeProductId) {
        const newPrice = await createEventPrice(
          stripeProductId,
          event.priceCents
        );
        stripePriceId = newPrice.id;
      } else {
        const { product, price } = await createEventProduct(
          event.title,
          event.priceCents
        );
        stripeProductId = product.id;
        stripePriceId = price.id;
      }

      await prisma.event.update({
        where: { id: eventId },
        data: {
          stripeProductId,
          stripePriceId,
        },
      });
    } catch (error) {
      console.error("Falha ao configurar preço do evento:", error);
      return jsonError("Falha ao configurar preço do evento", 500);
    }
  }
  if (!stripePriceId) {
    return jsonError("Preço do evento não configurado", 500);
  }

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(
      dbUser.email,
      dbUser.name,
      dbUser.stripeCustomerId
    );

    // Update user with customer ID if needed
    if (customerId !== dbUser.stripeCustomerId) {
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session
    const baseUrl = getAppBaseUrl();
    const successUrl = `${baseUrl}/api/stripe/events/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/clubs/${clubId}?eventId=${eventId}`;

    const checkoutSession = await createEventCheckoutSession({
      customerId,
      priceId: stripePriceId,
      eventId,
      userId: dbUser.id,
      clubId,
      successUrl,
      cancelUrl,
      stripeConnectAccountId: event.club.organizer.stripeConnectChargesEnabled
        ? event.club.organizer.stripeConnectAccountId || undefined
        : undefined,
      applicationFeePercent: event.club.organizer.stripeConnectChargesEnabled
        ? 10
        : undefined, // 10% platform fee
    });

    return jsonSuccess({ url: checkoutSession.url });
  } catch (error) {
    console.error("Falha ao criar sessão de checkout:", error);
    return jsonError("Falha ao criar sessão de checkout", 500);
  }
}
