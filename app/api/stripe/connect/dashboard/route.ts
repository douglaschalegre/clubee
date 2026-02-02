import {
  requireAuth,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";
import { createConnectLoginLink } from "@/lib/stripe";

/**
 * POST /api/stripe/connect/dashboard
 * Create a login link for the user's Stripe Express dashboard.
 */
export async function POST() {
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) {
    return authResult;
  }
  const { user } = authResult;

  if (!user.stripeConnectAccountId) {
    return jsonError("Conta Stripe Connect não encontrada", 400);
  }

  if (user.stripeConnectStatus !== "active") {
    return jsonError("Onboarding ainda não concluído", 400);
  }

  try {
    const loginLink = await createConnectLoginLink(
      user.stripeConnectAccountId
    );
    return Response.json({ url: loginLink.url });
  } catch (error) {
    console.error("Erro ao criar link do painel:", error);
    return jsonError("Falha ao abrir painel Stripe", 500);
  }
}
