#!/usr/bin/env tsx
import "dotenv/config";
import { prisma } from "../lib/db";
import { createEventPrice, createEventProduct } from "../lib/stripe";

async function backfillEventPricing() {
  const targetEventId = process.argv[2];

  const events = await prisma.event.findMany({
    where: {
      ...(targetEventId ? { id: targetEventId } : {}),
      priceCents: { gt: 0 },
      OR: [{ stripePriceId: null }, { stripeProductId: null }],
    },
    select: {
      id: true,
      title: true,
      priceCents: true,
      stripeProductId: true,
      stripePriceId: true,
      club: {
        select: {
          organizer: {
            select: {
              stripeConnectAccountId: true,
              stripeConnectChargesEnabled: true,
            },
          },
        },
      },
    },
  });

  if (events.length === 0) {
    console.log("No paid events missing Stripe pricing were found.");
    return;
  }

  console.log(`Found ${events.length} event(s) to backfill.`);

  for (const event of events) {
    if (!event.priceCents || event.priceCents <= 0) {
      console.log(`Skipping ${event.id} (priceCents is not valid).`);
      continue;
    }

    if (
      !event.club.organizer.stripeConnectChargesEnabled ||
      !event.club.organizer.stripeConnectAccountId
    ) {
      console.log(
        `Skipping ${event.id} (organizer Stripe Connect not enabled).`
      );
      continue;
    }

    let stripeProductId = event.stripeProductId;
    let stripePriceId = event.stripePriceId;

    try {
      if (stripeProductId && !stripePriceId) {
        const price = await createEventPrice(stripeProductId, event.priceCents);
        stripePriceId = price.id;
      } else if (!stripeProductId) {
        const { product, price } = await createEventProduct(
          event.title,
          event.priceCents
        );
        stripeProductId = product.id;
        stripePriceId = price.id;
      }

      if (!stripeProductId || !stripePriceId) {
        console.log(`Failed to create pricing for ${event.id}.`);
        continue;
      }

      await prisma.event.update({
        where: { id: event.id },
        data: {
          stripeProductId,
          stripePriceId,
        },
      });

      console.log(
        `Updated ${event.id} with Stripe pricing (${stripeProductId}, ${stripePriceId}).`
      );
    } catch (error) {
      console.error(`Failed to backfill ${event.id}:`, error);
    }
  }
}

backfillEventPricing()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
