import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function Header() {
  const session = await auth0.getSession();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/clubs" className="flex items-center gap-2">
          <span className="text-xl">🐝</span>
          <span className="text-xl font-bold">Clubee</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6">
          <Link
            href="/clubs"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Clubs
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={session.user.picture} alt={session.user.name} />
                <AvatarFallback>
                  {session.user.name?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth/logout">Logout</a>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href="/auth/login">Login</a>
              </Button>
              <Button size="sm" asChild>
                <a href="/auth/login?screen_hint=signup">Sign up</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
