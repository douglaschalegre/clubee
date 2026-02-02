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
 * Supports Stripe Connect with transfer_data for routing payments to organizers.
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  clubId,
  userId,
  successUrl,
  cancelUrl,
  stripeConnectAccountId,
  applicationFeePercent,
}: {
  customerId: string;
  priceId: string;
  clubId: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  stripeConnectAccountId?: string;
  applicationFeePercent?: number;
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
      ...(stripeConnectAccountId && {
        transfer_data: {
          destination: stripeConnectAccountId,
        },
        application_fee_percent: applicationFeePercent,
      }),
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

/**
 * Create a Stripe Connect Express account.
 */
export async function createConnectAccount(
  email: string,
  businessName?: string
): Promise<Stripe.Account> {
  return stripe.accounts.create({
    type: "express",
    email,
    business_profile: {
      name: businessName,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

/**
 * Create an account link for Stripe Connect onboarding.
 */
export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink> {
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

/**
 * Create a login link for the Express dashboard.
 */
export async function createConnectLoginLink(
  accountId: string
): Promise<Stripe.LoginLink> {
  return stripe.accounts.createLoginLink(accountId);
}

/**
 * Retrieve a Stripe Connect account.
 */
export async function getConnectAccount(
  accountId: string
): Promise<Stripe.Account> {
  return stripe.accounts.retrieve(accountId);
}

/**
 * Create a Stripe Product and Price for a club on the platform account.
 */
export async function createClubProduct(
  clubName: string,
  priceCents: number,
  currency = "brl",
  interval: "month" | "year" = "month"
): Promise<{ product: Stripe.Product; price: Stripe.Price }> {
  const product = await stripe.products.create({
    name: `Membresia - ${clubName}`,
    metadata: { source: "clubee" },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceCents,
    currency,
    recurring: { interval },
  });

  return { product, price };
}

/**
 * Archive an old price and create a new one for the same product.
 */
export async function updateClubPrice(
  productId: string,
  oldPriceId: string,
  priceCents: number,
  currency = "brl",
  interval: "month" | "year" = "month"
): Promise<Stripe.Price> {
  await stripe.prices.update(oldPriceId, { active: false });

  return stripe.prices.create({
    product: productId,
    unit_amount: priceCents,
    currency,
    recurring: { interval },
  });
}
