import type Stripe from "stripe";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

/**
 * GET /api/stripe/events/checkout/success
 * Handle successful Stripe checkout for event payments.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    redirect("/clubs?error=missing_session");
  }

  let clubId: string | undefined;
  let eventId: string | undefined;
  let userId: string | undefined;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paymentIntent = session.payment_intent as Stripe.PaymentIntent | null;
    const paymentSucceeded =
      session.payment_status === "paid" ||
      paymentIntent?.status === "succeeded";

    clubId = session.metadata?.clubId;
    eventId = session.metadata?.eventId;
    userId = session.metadata?.userId;

    if (!clubId || !eventId || !userId) {
      redirect("/clubs?error=invalid_session");
    }

    if (!paymentSucceeded) {
      redirect(`/clubs/${clubId}?eventId=${eventId}&eventPayment=processing`);
    }

    const amountPaid =
      typeof session.amount_total === "number"
        ? session.amount_total
        : typeof paymentIntent?.amount_received === "number"
          ? paymentIntent.amount_received
          : undefined;

    const result = await prisma.eventRsvp.updateMany({
      where: { eventId, userId },
      data: {
        status: "going",
        paidAt: new Date(),
        paidAmountCents: amountPaid,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          paymentIntent?.id ||
          (session.payment_intent as string | null) ||
          undefined,
      },
    });

    if (result.count === 0) {
      console.error("No RSVP updated after event checkout success:", {
        eventId,
        userId,
        sessionId,
      });
      redirect(
        `/clubs/${clubId}?eventId=${eventId}&eventPayment=missing_rsvp`
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Erro no sucesso do checkout de evento:", error);
    redirect("/clubs?error=checkout_failed");
  }

  if (!clubId || !eventId) {
    redirect("/clubs?error=invalid_session");
  }

  redirect(`/clubs/${clubId}?eventId=${eventId}&payment=success`);
}
