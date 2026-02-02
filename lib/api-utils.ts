import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { prisma } from "@/lib/db";
import { findOrCreateUser } from "@/lib/user";
import type { User, Membership, MembershipRole } from "@/lib/generated/prisma/client";

/**
 * Standard JSON error response.
 */
export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard JSON success response.
 */
export function jsonSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

interface AuthResult {
  user: User;
}

/**
 * Require authentication and return the DB user.
 * Creates user in DB if first login.
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const session = await auth0.getSession();

  if (!session?.user) {
    return jsonError("Não autorizado", 401);
  }

  try {
    const user = await findOrCreateUser({
      sub: session.user.sub,
      name: session.user.name,
      email: session.user.email,
      picture: session.user.picture,
    });

    return { user };
  } catch {
    return jsonError("Falha ao provisionar usuário", 500);
  }
}

/**
 * Check if the result is an error response.
 */
export function isErrorResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Get membership for a user in a club.
 */
export async function getMembership(
  userId: string,
  clubId: string
): Promise<Membership | null> {
  return prisma.membership.findUnique({
    where: {
      userId_clubId: { userId, clubId },
    },
  });
}

/**
 * Get active membership for a user in a club.
 */
export async function getActiveMembership(
  userId: string,
  clubId: string
): Promise<Membership | null> {
  return prisma.membership.findFirst({
    where: {
      userId,
      clubId,
      status: "active",
    },
  });
}

/**
 * Require active membership to access a club.
 * Returns membership or error response.
 */
export async function requireActiveMembership(
  userId: string,
  clubId: string
): Promise<Membership | NextResponse> {
  const membership = await getActiveMembership(userId, clubId);

  if (!membership) {
    return jsonError("Assinatura ativa obrigatória", 403);
  }

  return membership;
}

/**
 * Check if user is the organizer of a club.
 */
export async function isClubOrganizer(
  userId: string,
  clubId: string
): Promise<boolean> {
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: { organizerId: true },
  });

  return club?.organizerId === userId;
}

/**
 * Require user to be the organizer of a club.
 */
export async function requireOrganizer(
  userId: string,
  clubId: string
): Promise<true | NextResponse> {
  const isOrganizer = await isClubOrganizer(userId, clubId);

  if (!isOrganizer) {
    return jsonError("Acesso de organizador obrigatório", 403);
  }

  return true;
}

/**
 * Get the role of a user in a club.
 */
export async function getMembershipRole(
  userId: string,
  clubId: string
): Promise<MembershipRole | null> {
  const membership = await getMembership(userId, clubId);
  return membership?.role ?? null;
}
