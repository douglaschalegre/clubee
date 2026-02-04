#!/usr/bin/env tsx
import { prisma } from "../lib/db";
import { createEventProduct } from "../lib/stripe";

async function setupTestData() {
  console.log("🚀 Setting up test data...\n");

  // Find the first user to use as organizer
  const user = await prisma.user.findFirst();

  if (!user) {
    console.error("❌ No users found. Please create a user first by logging in.");
    return;
  }

  console.log(`✅ Using user: ${user.name} (${user.email})\n`);

  // 1. Create a FREE club
  console.log("📦 Creating FREE club...");
  const freeClub = await prisma.club.upsert({
    where: { id: "test-free-club" },
    create: {
      id: "test-free-club",
      name: "Free Test Club",
      description: "A free club for testing - anyone can join!",
      organizerId: user.id,
      membershipPriceCents: null, // FREE
    },
    update: {
      membershipPriceCents: null,
    },
  });
  console.log(`✅ Free club: ${freeClub.name}\n`);

  // 2. Create a free event (no approval)
  console.log("📅 Creating FREE event (no approval)...");
  const freeEvent = await prisma.event.upsert({
    where: { id: "test-free-event" },
    create: {
      id: "test-free-event",
      title: "Free Community Meetup",
      description: "Open to everyone, no payment or approval needed",
      startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      timezone: "America/Sao_Paulo",
      locationType: "physical",
      locationValue: "Av. Paulista, 1000 - São Paulo",
      clubId: freeClub.id,
      createdById: user.id,
      priceCents: null,
      requiresApproval: false,
    },
    update: {
      priceCents: null,
      requiresApproval: false,
    },
  });
  console.log(`✅ Free event: ${freeEvent.title}\n`);

  // 3. Create a paid event (no approval) - REQUIRES STRIPE CONNECT
  if (user.stripeConnectChargesEnabled && user.stripeConnectAccountId) {
    console.log("💰 Creating PAID event (no approval)...");

    // Create Stripe product and price
    const { product, price } = await createEventProduct(
      "Premium Workshop",
      2000 // R$ 20.00
    );

    const paidEvent = await prisma.event.upsert({
      where: { id: "test-paid-event" },
      create: {
        id: "test-paid-event",
        title: "Premium Workshop - R$ 20",
        description: "Pay R$ 20 to attend this exclusive workshop",
        startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        timezone: "America/Sao_Paulo",
        locationType: "remote",
        locationValue: "https://meet.google.com/xyz",
        clubId: freeClub.id,
        createdById: user.id,
        priceCents: 2000,
        stripeProductId: product.id,
        stripePriceId: price.id,
        requiresApproval: false,
      },
      update: {
        priceCents: 2000,
        stripeProductId: product.id,
        stripePriceId: price.id,
        requiresApproval: false,
      },
    });
    console.log(`✅ Paid event: ${paidEvent.title}\n`);
  } else {
    console.log("⚠️  Skipping paid event - Stripe Connect not enabled for user");
    console.log("   Set up Stripe Connect first to test paid events\n");
  }

  // 4. Create an approval-based event (free)
  console.log("✋ Creating APPROVAL event (free)...");
  const approvalEvent = await prisma.event.upsert({
    where: { id: "test-approval-event" },
    create: {
      id: "test-approval-event",
      title: "VIP Meetup (Approval Required)",
      description: "Limited seats - organizer approval required",
      startsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      timezone: "America/Sao_Paulo",
      locationType: "physical",
      locationValue: "Private Location (disclosed after approval)",
      clubId: freeClub.id,
      createdById: user.id,
      priceCents: null,
      requiresApproval: true,
    },
    update: {
      priceCents: null,
      requiresApproval: true,
    },
  });
  console.log(`✅ Approval event: ${approvalEvent.title}\n`);

  // 5. Create a paid + approval event - REQUIRES STRIPE CONNECT
  if (user.stripeConnectChargesEnabled && user.stripeConnectAccountId) {
    console.log("💰✋ Creating PAID + APPROVAL event...");

    const { product, price } = await createEventProduct(
      "Exclusive Masterclass",
      5000 // R$ 50.00
    );

    const paidApprovalEvent = await prisma.event.upsert({
      where: { id: "test-paid-approval-event" },
      create: {
        id: "test-paid-approval-event",
        title: "Exclusive Masterclass - R$ 50 (Approval)",
        description: "Premium event - requires approval AND payment",
        startsAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        timezone: "America/Sao_Paulo",
        locationType: "remote",
        locationValue: "https://zoom.us/j/exclusive",
        clubId: freeClub.id,
        createdById: user.id,
        priceCents: 5000,
        stripeProductId: product.id,
        stripePriceId: price.id,
        requiresApproval: true,
      },
      update: {
        priceCents: 5000,
        stripeProductId: product.id,
        stripePriceId: price.id,
        requiresApproval: true,
      },
    });
    console.log(`✅ Paid + Approval event: ${paidApprovalEvent.title}\n`);
  }

  console.log("✨ Test data setup complete!");
  console.log(`\n🔗 Visit: http://localhost:3000/clubs/${freeClub.id}`);
}

setupTestData()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
