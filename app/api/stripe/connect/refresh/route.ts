import { NextResponse } from "next/server";

/**
 * GET /api/stripe/connect/refresh
 * Stripe redirects here if the account link expired.
 */
export async function GET() {
  const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";
  return NextResponse.redirect(`${baseUrl}/my-clubs?connect=refresh`);
}
