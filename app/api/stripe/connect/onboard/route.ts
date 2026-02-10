import { prisma } from "@/lib/db";
import {
  requireAuth,
  isErrorResponse,
  jsonError,
} from "@/lib/api-utils";
import {
  createConnectAccount,
  createAccountLink,
} from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAppBaseUrl } from "@/lib/urls";

/**
 * POST /api/stripe/connect/onboard
 * Start or continue Stripe Connect onboarding for the current user.
 * Body: { clubId?: string }
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

  let clubId: string | undefined;
  try {
    const body = await request.json();
    clubId = body.clubId;
  } catch {
    // No body is fine
  }

  const baseUrl = getAppBaseUrl();
  const callbackParam = clubId ? `?clubId=${clubId}` : "";
  const refreshUrl = `${baseUrl}/api/stripe/connect/refresh${callbackParam}`;
  const returnUrl = `${baseUrl}/api/stripe/connect/return${callbackParam}`;

  try {
    let accountId = user.stripeConnectAccountId;

    if (!accountId) {
      // Create new Express account
      const account = await createConnectAccount(user.email, user.name);
      accountId = account.id;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          stripeConnectAccountId: accountId,
          stripeConnectStatus: "onboarding_started",
        },
      });
    }

    // Create account link (works for both new and incomplete onboarding)
    const accountLink = await createAccountLink(
      accountId,
      refreshUrl,
      returnUrl
    );

    return Response.json({ url: accountLink.url });
  } catch (error) {
    console.error("Erro no onboarding Connect:", error);
    return jsonError("Falha ao iniciar onboarding", 500);
  }
}
