import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { getConnectAccount } from "@/lib/stripe";
import type { StripeConnectStatus } from "@/lib/generated/prisma/client";

/**
 * GET /api/stripe/connect/return
 * Stripe redirects here after onboarding completes or user returns.
 */
export async function GET() {
  const session = await auth0.getSession();
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

  if (!session?.user?.sub) {
    return NextResponse.redirect(`${baseUrl}/auth/login`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    select: { id: true, stripeConnectAccountId: true },
  });

  if (!dbUser?.stripeConnectAccountId) {
    return NextResponse.redirect(`${baseUrl}/my-clubs?connect=error`);
  }

  try {
    const account = await getConnectAccount(dbUser.stripeConnectAccountId);

    let status: StripeConnectStatus = "onboarding_incomplete";
    if (account.charges_enabled && account.details_submitted) {
      status = "active";
    } else if (account.requirements?.disabled_reason) {
      status = "restricted";
    }

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        stripeConnectStatus: status,
        stripeConnectChargesEnabled: account.charges_enabled ?? false,
        stripeConnectPayoutsEnabled: account.payouts_enabled ?? false,
      },
    });

    return NextResponse.redirect(`${baseUrl}/my-clubs?connect=returned`);
  } catch (error) {
    console.error("Erro ao verificar conta Connect:", error);
    return NextResponse.redirect(`${baseUrl}/my-clubs?connect=error`);
  }
}
