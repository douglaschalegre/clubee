import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { findOrCreateUser } from "@/lib/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginButtons } from "@/components/login-buttons";

export async function Header() {
  const session = await auth0.getSession();
  let dbUser = null;

  if (session?.user) {
    try {
      dbUser = await findOrCreateUser({
        sub: session.user.sub,
        name: session.user.name,
        email: session.user.email,
        picture: session.user.picture,
        accessToken: session.tokenSet?.accessToken,
      });
    } catch {
      dbUser = null;
    }
  }

  const displayName =
    dbUser?.name ?? session?.user?.name ?? session?.user?.email ?? "Usuário";
  const avatarUrl =
    dbUser?.avatarUrl?.trim() || session?.user?.picture || undefined;

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
            Explorar
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full transition-shadow hover:ring-2 hover:ring-primary/40 hover:ring-offset-2 hover:ring-offset-background"
                    aria-label="Abrir menu do usuário"
                  >
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 text-sm font-medium">
                        {displayName[0]?.toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Perfil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/my-clubs?view=organizing">Meus clubes</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/financeiro">Painel financeiro</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href="/auth/logout">Sair</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <LoginButtons />
          )}
        </div>
      </div>
    </header>
  );
}
