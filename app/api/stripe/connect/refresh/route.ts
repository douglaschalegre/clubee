import { NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/urls";

/**
 * GET /api/stripe/connect/refresh
 * Stripe redirects here if the account link expired.
 */
export async function GET(request: Request) {
  const baseUrl = getAppBaseUrl();
  const { searchParams } = new URL(request.url);
  const clubId = searchParams.get("clubId");

  const redirectUrl = clubId
    ? `${baseUrl}/clubs/${clubId}/settings?connect=refresh`
    : `${baseUrl}/my-clubs?connect=refresh`;

  return NextResponse.redirect(redirectUrl);
}
