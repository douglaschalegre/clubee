import { prisma } from "@/lib/db";
import {
  isErrorResponse,
  jsonError,
  requireAuth,
} from "@/lib/api-utils";
import { getOrCreateCustomer, stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/urls";

/**
 * POST /api/stripe/portal
 * Create a Stripe billing portal session for a membership.
 * Body: { membershipId: string }
 */
export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  const rateLimitResponse = checkRateLimit({
    request,
    identifier: user.id,
    limit: 20,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let membershipId: string;
  try {
    const body = await request.json();
    membershipId = body.membershipId;
    if (!membershipId) {
      return jsonError("membershipId é obrigatório", 400);
    }
  } catch {
    return jsonError("Corpo da requisição inválido", 400);
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      club: { select: { id: true } },
    },
  });

  if (!membership || membership.userId !== user.id) {
    return jsonError("Assinatura não encontrada", 404);
  }

  if (!membership.stripeSubscriptionId) {
    return jsonError("Sem assinatura ativa", 400);
  }

  const customerId = await getOrCreateCustomer(
    user.email,
    user.name,
    user.stripeCustomerId
  );

  if (customerId !== user.stripeCustomerId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const baseUrl = getAppBaseUrl();
  const returnUrl = `${baseUrl}/clubs/${membership.club.id}`;

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error("Erro ao criar portal de cobrança:", error);
    return jsonError("Falha ao abrir o portal de cobrança", 500);
  }
}
