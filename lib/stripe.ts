import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

/**
 * Get or create a Stripe customer for a user.
 */
export async function getOrCreateCustomer(
  email: string,
  name: string,
  existingCustomerId?: string | null
): Promise<string> {
  // If we already have a customer ID, verify it exists
  if (existingCustomerId) {
    try {
      await stripe.customers.retrieve(existingCustomerId);
      return existingCustomerId;
    } catch {
      // Customer doesn't exist, create a new one
    }
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      source: "clubee",
    },
  });

  return customer.id;
}

/**
 * Create a checkout session for club membership subscription.
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  clubId,
  userId,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  priceId: string;
  clubId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      clubId,
      userId,
    },
    subscription_data: {
      metadata: {
        clubId,
        userId,
      },
    },
  });
}

/**
 * Verify a Stripe webhook signature.
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
