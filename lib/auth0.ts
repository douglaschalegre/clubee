import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { redirect } from "next/navigation";
import { findOrCreateUser } from "@/lib/user";

export const auth0 = new Auth0Client();

interface PageAuthOptions {
  returnUrl?: string;
  requireProfileCompleted?: boolean;
}

export async function requirePageAuth(options?: PageAuthOptions) {
  const session = await auth0.getSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  const user = await findOrCreateUser({
    sub: session.user.sub,
    name: session.user.name,
    email: session.user.email,
    picture: session.user.picture,
    accessToken: session.tokenSet?.accessToken,
  });

  if (options?.requireProfileCompleted && !user.profileCompleted) {
    const returnTo = options.returnUrl ? `?returnTo=${encodeURIComponent(options.returnUrl)}` : "";
    redirect(`/profile${returnTo}`);
  }

  return { session, user };
}
