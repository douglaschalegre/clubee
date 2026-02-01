import { prisma } from "@/lib/db";
import {
  requireAuth,
  getMembership,
  isErrorResponse,
  jsonError,
  jsonSuccess,
} from "@/lib/api-utils";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/clubs/[id]/join
 * Deprecated: use Stripe checkout endpoint instead.
 */
export async function POST(_request: Request, _context: RouteContext) {
  return jsonError("Join via Stripe checkout", 410);
}
