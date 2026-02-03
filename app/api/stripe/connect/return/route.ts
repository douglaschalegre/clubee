import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { getConnectAccount } from "@/lib/stripe";
import type { StripeConnectStatus } from "@/lib/generated/prisma/client";

/**
 * GET /api/stripe/connect/return
 * Stripe redirects here after onboarding completes or user returns.
 */
export async function GET(request: Request) {
  const session = await auth0.getSession();
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");

  if (!session?.user?.sub) {
    return NextResponse.redirect(`${baseUrl}/auth/login`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, stripeConnectAccountId: true },
  });

  const fallbackUrl = clubId
    ? `${baseUrl}/clubs/${clubId}/settings`
    : `${baseUrl}/my-clubs`;

  if (!dbUser?.stripeConnectAccountId) {
    return NextResponse.redirect(`${fallbackUrl}?connect=error`);
  }

  try {
    const account = await getConnectAccount(dbUser.stripeConnectAccountId);

    console.log("Connect account state:", {
      id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      disabled_reason: account.requirements?.disabled_reason,
      currently_due: account.requirements?.currently_due,
      past_due: account.requirements?.past_due,
    });

    let status: StripeConnectStatus = "onboarding_incomplete";
    if (account.charges_enabled) {
      status = "active";
    } else if (account.requirements?.disabled_reason) {
      status = "restricted";
    } else if (account.details_submitted) {
      status = "onboarding_incomplete";
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        stripeConnectStatus: status,
        stripeConnectChargesEnabled: account.charges_enabled ?? false,
        stripeConnectPayoutsEnabled: account.payouts_enabled ?? false,
      },
    });

    return NextResponse.redirect(`${fallbackUrl}?connect=returned`);
  } catch (error) {
    console.error("Erro ao verificar conta Connect:", error);
    return NextResponse.redirect(`${fallbackUrl}?connect=error`);
  }
}
