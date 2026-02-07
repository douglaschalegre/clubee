import { prisma } from "@/lib/db";
import type { User } from "@/lib/generated/prisma/client";

interface Auth0Profile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

function isDatabaseUser(auth0Id: string): boolean {
  return auth0Id.startsWith("auth0|");
}

/**
 * Find or create a user from Auth0 profile.
 * Called on authenticated requests to ensure DB user exists.
 */
export async function findOrCreateUser(profile: Auth0Profile): Promise<User> {
  const { sub: auth0Id, name, email, picture } = profile;

  if (!email) {
    throw new Error("Auth0 profile missing email");
  }

  const existing = await prisma.user.findUnique({
    where: { auth0Id },
  });

  const trimmedName = name?.trim();
  const fallbackName = trimmedName && trimmedName.length > 0
    ? trimmedName
    : email.split("@")[0];

  if (!existing) {
    const databaseUser = isDatabaseUser(auth0Id);
    return prisma.user.create({
      data: {
        auth0Id,
        name: fallbackName,
        email,
        avatarUrl: picture,
        profileCompleted: !databaseUser,
      },
    });
  }

  const data: {
    email?: string;
    profileCompleted?: boolean;
    avatarUrl?: string | null;
  } = {};

  if (existing.email !== email) {
    data.email = email;
  }

  if (!existing.profileCompleted && !isDatabaseUser(auth0Id)) {
    data.profileCompleted = true;
  }

  if (!existing.avatarUrl && picture) {
    data.avatarUrl = picture;
  }

  if (Object.keys(data).length === 0) {
    return existing;
  }

  return prisma.user.update({
    where: { id: existing.id },
    data,
  });
}

/**
 * Get user by ID.
 */
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * Get user by Auth0 ID.
 */
export async function getUserByAuth0Id(auth0Id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { auth0Id } });
}
