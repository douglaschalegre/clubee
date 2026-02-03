"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LoginButtons() {
  const pathname = usePathname();
  const returnTo = encodeURIComponent(pathname);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
        asChild
      >
        <a href={`/auth/login?returnTo=${returnTo}`}>Entrar</a>
      </Button>
      <Button
        size="sm"
        className="shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.02]"
        asChild
      >
        <a href={`/auth/login?screen_hint=signup&returnTo=${returnTo}`}>Criar conta</a>
      </Button>
    </>
  );
}
