import { auth0 } from "@/lib/auth0";
import { NextRequest } from "next/server";

export const GET = auth0.handleAuth({
  login: auth0.handleLogin({
    returnTo: (req: NextRequest) => {
      // Get the returnTo parameter from the URL
      const searchParams = req.nextUrl.searchParams;
      const returnTo = searchParams.get("returnTo");

      // If returnTo is provided and is a relative path, use it
      if (returnTo && returnTo.startsWith("/")) {
        return returnTo;
      }

      // Default to home page
      return "/";
    },
  }),
});
