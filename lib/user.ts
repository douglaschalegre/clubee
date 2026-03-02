import { prisma } from "@/lib/db";
import type { User } from "@/lib/generated/prisma/client";

interface Auth0Profile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  accessToken?: string;
}

function isDatabaseUser(auth0Id: string): boolean {
  return auth0Id.startsWith("auth0|");
}

async function fetchAuth0Picture(accessToken?: string): Promise<{ picture: string | null; checked: boolean }> {
  if (!accessToken) {
    return { picture: null, checked: false };
  }

  const domain = process.env.AUTH0_DOMAIN;
  if (!domain) {
    return { picture: null, checked: false };
  }

  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;

  try {
    const response = await fetch(`${baseUrl}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return { picture: null, checked: false };
    }

    const data = (await response.json()) as { picture?: unknown };
    if (typeof data.picture === "string") {
      const trimmed = data.picture.trim();
      return { picture: trimmed.length > 0 ? trimmed : null, checked: true };
    }
    return { picture: null, checked: true };
  } catch {
    return { picture: null, checked: false };
  }
}

/**
 * Find or create a user from Auth0 profile.
 * Called on authenticated requests to ensure DB user exists.
 */
export async function findOrCreateUser(profile: Auth0Profile): Promise<User> {
  const { sub: auth0Id, name, email, picture } = profile;
  let normalizedPicture = typeof picture === "string" ? picture.trim() : "";
  let hasPicture = normalizedPicture.length > 0;

  if (!email) {
    throw new Error("Auth0 profile missing email");
  }

  const existing = await prisma.user.findUnique({
    where: { auth0Id },
  });

  // Optimization: Only fetch from Auth0 if we haven't checked before.
  // We use "" (empty string) in the database to indicate "checked but no avatar found".
  // null means "not checked/unknown".
  let checkedForPicture = false;
  if (!hasPicture && (!existing || existing.avatarUrl === null)) {
    const { picture: fetchedPicture, checked } = await fetchAuth0Picture(profile.accessToken);
    checkedForPicture = checked;
    if (fetchedPicture) {
      normalizedPicture = fetchedPicture;
      hasPicture = true;
    }
  }

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
        // If we found a picture, use it.
        // If we didn't find one, but successfully checked, store "" to indicate we checked.
        // If the check failed (e.g. network error), keep it undefined (null in db) to retry later.
        avatarUrl: hasPicture ? normalizedPicture : (checkedForPicture ? "" : undefined),
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

  if (hasPicture && normalizedPicture !== existing.avatarUrl) {
    data.avatarUrl = normalizedPicture;
  } else if (!hasPicture && existing.avatarUrl === null && checkedForPicture) {
    // If we checked (fetched successfully) and found nothing, update null -> "" to avoid future checks.
    data.avatarUrl = "";
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
