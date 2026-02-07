"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface JoinButtonProps {
  clubId: string;
  requiresPayment: boolean;
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
  requiresPayment,
  canAcceptPayments = true,
  priceCents,
}: JoinButtonProps) {
  const [isJoining, setIsJoining] = useState(false);

  async function handleJoin() {
    setIsJoining(true);

    try {
      const endpoint = requiresPayment
        ? "/api/stripe/checkout"
        : `/api/clubs/${clubId}/join`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: requiresPayment
          ? {
              "Content-Type": "application/json",
            }
          : undefined,
        body: requiresPayment ? JSON.stringify({ clubId }) : undefined,
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
        throw new Error(
          data.error ||
            (requiresPayment
              ? "Falha ao criar a sessão de checkout"
              : "Falha ao entrar no clube")
        );
      }

      if (requiresPayment) {
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          throw new Error("Nenhuma URL de checkout retornada");
        }
      } else {
        // Free club: membership created, go to club page
        window.location.href = `/clubs/${clubId}`;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
      setIsJoining(false);
    }
  }

  if (requiresPayment && !canAcceptPayments) {
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

  const label = requiresPayment
    ? priceCents
      ? `Entrar no clube - ${formatCurrency(priceCents)}/mês`
      : "Entrar no clube - Assinar"
    : "Entrar no clube";

  return (
    <div>
      <Button
        onClick={handleJoin}
        disabled={isJoining}
        size="lg"
        className="w-full gap-2 shadow-honey transition-all hover:shadow-honey-lg hover:scale-[1.01] disabled:opacity-70"
      >
        {isJoining ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {requiresPayment
              ? "Redirecionando para o pagamento..."
              : "Entrando no clube..."}
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
