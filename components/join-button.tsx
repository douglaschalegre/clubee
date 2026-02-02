"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

interface JoinButtonProps {
  clubId: string;
  canAcceptPayments?: boolean;
  priceCents?: number | null;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function JoinButton({
  clubId,
  canAcceptPayments = true,
  priceCents,
}: JoinButtonProps) {
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setIsJoining(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clubId }),
      });

      // Check if response has content
      const text = await res.text();
      if (!text) {
        throw new Error(`Resposta vazia do servidor (status: ${res.status})`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta JSON inválida: ${text.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Falha ao criar a sessão de checkout");
      }

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error("Nenhuma URL de checkout retornada");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
      setIsJoining(false);
    }
  }

  if (!canAcceptPayments) {
    return (
      <Button
        disabled
        size="lg"
        variant="secondary"
        className="w-full gap-2"
      >
        Pagamentos ainda não configurados
      </Button>
    );
  }

  const label = priceCents
    ? `Entrar no clube - ${formatCurrency(priceCents)}/mês`
    : "Entrar no clube - Assinar";

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button
        onClick={handleJoin}
        disabled={isJoining}
        size="lg"
        className="w-full gap-2 shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.01] disabled:opacity-70"
      >
        {isJoining ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirecionando para o pagamento...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
}
