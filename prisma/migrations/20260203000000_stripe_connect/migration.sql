-- CreateEnum
CREATE TYPE "StripeConnectStatus" AS ENUM ('not_started', 'onboarding_started', 'onboarding_incomplete', 'active', 'restricted', 'disabled');

-- AlterTable
ALTER TABLE "clubs" ADD COLUMN     "membership_price_cents" INTEGER,
ADD COLUMN     "stripe_price_id" TEXT,
ADD COLUMN     "stripe_product_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripe_connect_account_id" TEXT,
ADD COLUMN     "stripe_connect_charges_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_connect_payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_connect_status" "StripeConnectStatus" NOT NULL DEFAULT 'not_started';

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_connect_account_id_key" ON "users"("stripe_connect_account_id");
