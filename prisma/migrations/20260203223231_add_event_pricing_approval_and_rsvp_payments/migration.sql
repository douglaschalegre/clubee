-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventRsvpStatus" ADD VALUE 'pending_payment';
ALTER TYPE "EventRsvpStatus" ADD VALUE 'pending_approval';
ALTER TYPE "EventRsvpStatus" ADD VALUE 'approved_pending_payment';
ALTER TYPE "EventRsvpStatus" ADD VALUE 'rejected';
ALTER TYPE "EventRsvpStatus" ADD VALUE 'payment_failed';

-- AlterTable
ALTER TABLE "event_rsvps" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "paid_amount_cents" INTEGER,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "stripe_checkout_session_id" TEXT,
ADD COLUMN     "stripe_payment_intent_id" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "price_cents" INTEGER,
ADD COLUMN     "requires_approval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_price_id" TEXT,
ADD COLUMN     "stripe_product_id" TEXT;

-- CreateIndex
CREATE INDEX "event_rsvps_status_idx" ON "event_rsvps"("status");

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
