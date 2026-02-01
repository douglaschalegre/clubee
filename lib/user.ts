import { prisma } from "@/lib/db";
import type { User } from "@/lib/generated/prisma/client";

interface Auth0Profile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
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

  const user = await prisma.user.upsert({
    where: { auth0Id },
    update: {
      name: name ?? email.split("@")[0],
      email,
      avatarUrl: picture,
    },
    create: {
      auth0Id,
      name: name ?? email.split("@")[0],
      email,
      avatarUrl: picture,
    },
  });

  return user;
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
