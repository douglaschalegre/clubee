"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";

export default function FinanceiroPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function redirect() {
      try {
        const res = await fetch("/api/stripe/connect/dashboard", {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Falha ao abrir o painel financeiro");
          setLoading(false);
          return;
        }

        if (!data.url) {
          setError("Nenhuma URL de painel retornada");
          setLoading(false);
          return;
        }

        window.location.href = data.url;
      } catch {
        setError("Falha ao conectar com o servidor");
        setLoading(false);
      }
    }

    redirect();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          Redirecionando para o painel financeiro...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <div className="text-center space-y-2">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Painel financeiro indisponível
        </h1>
        <p className="max-w-md text-muted-foreground">
          {error === "Conta Stripe Connect não encontrada" ||
          error === "Onboarding ainda não concluído"
            ? "Você precisa configurar o Stripe Connect nas configurações de um dos seus clubes para acessar o painel financeiro."
            : error}
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href="/my-clubs?view=organizing">Meus clubes</Link>
        </Button>
        <Button asChild className="gap-2">
          <Link href="/clubs">
            Explorar clubes
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
