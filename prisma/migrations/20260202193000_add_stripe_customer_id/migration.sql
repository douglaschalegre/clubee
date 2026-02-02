-- Add stripe customer ID to users
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" TEXT;

-- Add unique index for Stripe customer ID
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
