import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export async function Header() {
  const session = await auth0.getSession();

  return (
    <header className="relative border-b border-border/50 bg-card/80 backdrop-blur-sm">
      {/* Subtle honeycomb pattern overlay */}
      <div className="absolute inset-0 pattern-honeycomb opacity-50" />
      
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          href="/" 
          className="group flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
        >
          {/* Hexagonal bee icon */}
          <div className="relative flex h-9 w-9 items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20" />
            <span className="relative text-xl">🐝</span>
          </div>
          <span 
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Clubee
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href="/clubs"
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Explore
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-shadow hover:ring-primary/40">
                  <AvatarImage src={session.user.picture} alt={session.user.name} />
                  <AvatarFallback className="bg-primary/10 text-sm font-medium">
                    {session.user.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="/auth/logout">Logout</a>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                asChild
              >
                <a href="/auth/login">Login</a>
              </Button>
              <Button 
                size="sm" 
                className="shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.02]"
                asChild
              >
                <a href="/auth/login?screen_hint=signup">Sign up</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
