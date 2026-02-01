import { prisma } from "@/lib/db";
import { constructWebhookEvent, stripe } from "@/lib/stripe";
import type Stripe from "stripe";

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = constructWebhookEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Unhandled event type
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err);
    return new Response("Webhook handler failed", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}

/**
 * Handle checkout.session.completed - create membership if not exists.
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const clubId = session.metadata?.clubId;
  const userId = session.metadata?.userId;

  if (!clubId || !userId) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  // Retrieve subscription for period end
  let currentPeriodEnd: Date | null = null;
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );
    if (subscription.items?.data?.[0]?.current_period_end) {
      currentPeriodEnd = new Date(
        subscription.items.data[0].current_period_end * 1000
      );
    }
  }

  // Upsert membership (idempotent)
  await prisma.membership.upsert({
    where: {
      userId_clubId: {
        userId,
        clubId,
      },
    },
    update: {
      status: "active",
      stripeSubscriptionId: session.subscription as string | null,
      currentPeriodEnd,
    },
    create: {
      userId,
      clubId,
      role: "member",
      status: "active",
      stripeSubscriptionId: session.subscription as string | null,
      currentPeriodEnd,
    },
  });

  console.log(`Membership created/updated for user ${userId} in club ${clubId}`);
}

/**
 * Handle customer.subscription.updated - sync status and period.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clubId = subscription.metadata?.clubId;
  const userId = subscription.metadata?.userId;

  if (!clubId || !userId) {
    console.log("Missing metadata in subscription:", subscription.id);
    return;
  }

  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null;

  // Determine status based on subscription status
  const isActive =
    subscription.status === "active" || subscription.status === "trialing";

  await prisma.membership.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: isActive ? "active" : "inactive",
      currentPeriodEnd,
    },
  });

  console.log(`Subscription ${subscription.id} updated: ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted - mark membership inactive.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.membership.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: "inactive",
    },
  });

  console.log(`Subscription ${subscription.id} deleted, membership deactivated`);
}

/**
 * Handle invoice.payment_succeeded - update period end.
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;

  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end
    ? new Date(subscription.items.data[0].current_period_end * 1000)
    : null;

  await prisma.membership.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: "active",
      currentPeriodEnd,
    },
  });

  console.log(`Invoice paid for subscription ${subscription.id}`);
}

/**
 * Handle invoice.payment_failed - optionally mark inactive or notify.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof invoice.parent?.subscription_details?.subscription === "string"
      ? invoice.parent.subscription_details.subscription
      : invoice.parent?.subscription_details?.subscription?.id;

  if (!subscriptionId) return;

  // For now, just log - you might want to send email notifications
  // or mark as inactive after multiple failures
  console.log(`Payment failed for subscription ${subscriptionId}`);
}
