import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Handle login route with custom returnTo logic
  if (pathname.endsWith("/login")) {
    const returnTo = searchParams.get("returnTo");
    const screenHint = searchParams.get("screen_hint") ?? undefined;

    // If returnTo is provided and is a relative path, use it
    const returnToPath = returnTo && returnTo.startsWith("/") ? returnTo : "/";

    return auth0.startInteractiveLogin({
      returnTo: returnToPath,
      authorizationParameters: {
        scope: "openid profile email",
        ...(screenHint ? { screen_hint: screenHint } : {}),
      },
    });
  }

  // For all other auth routes (callback, logout, etc.), use middleware
  return auth0.middleware(req);
}
