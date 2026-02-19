import { promiseAllLimit } from "../lib/concurrency";
import { setTimeout } from "timers/promises";

// Mock implementation of Stripe cancellation
const mockCancelSubscription = async (id: string) => {
  // Simulate network latency of 200ms
  await setTimeout(200);
  return { id, status: 'canceled' };
};

// Test data: 50 subscriptions
const membershipsWithSubs = Array.from({ length: 50 }, (_, i) => ({
  stripeSubscriptionId: `sub_${i}`
}));

async function runSequential() {
  console.log('Starting sequential processing...');
  const start = performance.now();

  for (const m of membershipsWithSubs) {
    if (m.stripeSubscriptionId) {
      try {
        await mockCancelSubscription(m.stripeSubscriptionId);
      } catch (error) {
        console.error(`Error canceling ${m.stripeSubscriptionId}`, error);
      }
    }
  }

  const end = performance.now();
  console.log(`Sequential processing took ${(end - start).toFixed(2)}ms`);
  return end - start;
}

// Use the actual helper function
async function runConcurrent(limit: number) {
  console.log(`Starting concurrent processing (limit=${limit}) using lib/concurrency...`);
  const start = performance.now();

  await promiseAllLimit(membershipsWithSubs, limit, async (m) => {
      if (m.stripeSubscriptionId) {
        try {
          await mockCancelSubscription(m.stripeSubscriptionId);
        } catch (error) {
          console.error(`Error canceling ${m.stripeSubscriptionId}`, error);
        }
      }
  });

  const end = performance.now();
  console.log(`Concurrent processing took ${(end - start).toFixed(2)}ms`);
  return end - start;
}

async function main() {
  console.log('--- BENCHMARK: Stripe Subscription Cancellation ---');
  console.log(`Processing ${membershipsWithSubs.length} subscriptions`);

  const sequentialTime = await runSequential();
  const concurrentTime = await runConcurrent(5);

  const improvement = ((sequentialTime - concurrentTime) / sequentialTime) * 100;
  console.log(`\nImprovement: ${improvement.toFixed(2)}% faster`);
}

main().catch(console.error);
