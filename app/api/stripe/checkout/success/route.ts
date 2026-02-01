import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

/**
 * GET /api/stripe/checkout/success
 * Handle successful Stripe checkout - create membership and redirect to club.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    redirect("/clubs?error=missing_session");
  }

  try {
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status !== "paid") {
      redirect("/clubs?error=payment_incomplete");
    }

    const clubId = session.metadata?.clubId;
    const userId = session.metadata?.userId;

    if (!clubId || !userId) {
      redirect("/clubs?error=invalid_session");
    }

    // Get subscription details
    const subscription = session.subscription as import("stripe").Stripe.Subscription | null;
    
    // Get current period end from the first subscription item
    const currentPeriodEnd = subscription?.items?.data?.[0]?.current_period_end
      ? new Date(subscription.items.data[0].current_period_end * 1000)
      : null;
    
    // Check if membership already exists (idempotency)
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_clubId: {
          userId,
          clubId,
        },
      },
    });

    if (!existingMembership) {
      // Create new membership
      await prisma.membership.create({
        data: {
          userId,
          clubId,
          role: "member",
          status: "active",
          stripeSubscriptionId: subscription?.id || null,
          currentPeriodEnd,
        },
      });
    } else if (subscription && !existingMembership.stripeSubscriptionId) {
      // Update existing membership with subscription info
      await prisma.membership.update({
        where: { id: existingMembership.id },
        data: {
          status: "active",
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd,
        },
      });
    }

    // Redirect to the club page
    redirect(`/clubs/${clubId}?joined=true`);
  } catch (error) {
    console.error("Checkout success error:", error);
    redirect("/clubs?error=checkout_failed");
  }
}
