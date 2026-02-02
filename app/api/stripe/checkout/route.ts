import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/stripe";

/**
 * POST /api/stripe/checkout
 * Create a Stripe checkout session for club membership.
 * Body: { clubId: string }
 */
export async function POST(request: Request) {
  // Require authentication
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  // Parse request body
  let clubId: string;
  try {
    const body = await request.json();
    clubId = body.clubId;
    if (!clubId) {
      return jsonError("clubId é obrigatório", 400);
    }
  } catch {
    return jsonError("Corpo da requisição inválido", 400);
  }

  // Check if club exists
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { id: true, name: true },
  });

  if (!club) {
    return jsonError("Clube não encontrado", 404);
  }

  // Check if already a member
  const existingMembership = await prisma.membership.findUnique({
    where: {
      userId_clubId: {
        userId: user.id,
        clubId,
      },
    },
  });

  if (existingMembership) {
    return jsonError("Você já é membro deste clube", 400);
  }

  // Get or create Stripe customer
  const stripeCustomerId = await getOrCreateCustomer(
    user.email,
    user.name,
    user.stripeCustomerId
  );

  // Update user with Stripe customer ID if new
  if (stripeCustomerId !== user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId },
    });
  }

  // Get price ID from env (in production, clubs would have their own prices)
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return jsonError("Stripe não configurado", 500);
  }

  // Build success and cancel URLs
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const successUrl = `${baseUrl}/api/stripe/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/clubs/${clubId}`;

  try {
    // Create checkout session
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      clubId,
      userId: user.id,
      successUrl,
      cancelUrl,
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Erro no checkout:", error);
    return jsonError("Falha ao criar sessão de checkout", 500);
  }
}
