"use client";

import { useState } from "react";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { StripeConnectStatus } from "@/lib/generated/prisma/client";

interface FinanceiroDashboardCtaProps {
  canAccessDashboard: boolean;
  status: StripeConnectStatus;
}

const onboardingCopy: Record<
  StripeConnectStatus,
  { label: string; helper: string; disabled?: boolean }
> = {
  not_started: {
    label: "Conectar Stripe",
    helper: "Leva alguns minutos e é feito no Stripe.",
  },
  onboarding_started: {
    label: "Continuar configuração",
    helper: "Retome o onboarding para ativar o painel.",
  },
  onboarding_incomplete: {
    label: "Continuar configuração",
    helper: "Finalize o onboarding para liberar pagamentos.",
  },
  active: {
    label: "Abrir painel Stripe",
    helper: "Abriremos o Stripe em uma nova aba.",
  },
  restricted: {
    label: "Resolver pendências",
    helper: "Abra o Stripe para revisar pendências e voltar a receber.",
  },
  disabled: {
    label: "Conta desativada",
    helper: "Entre em contato com o suporte do Stripe.",
    disabled: true,
  },
};

export function FinanceiroDashboardCta({
  canAccessDashboard,
  status,
}: FinanceiroDashboardCtaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOnboard() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao iniciar onboarding");
      }

      if (!data.url) {
        throw new Error("Nenhuma URL de onboarding retornada");
      }

      const popup = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!popup) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOpenDashboard() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/dashboard", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao abrir o painel");
      }

      if (!data.url) {
        throw new Error("Nenhuma URL de painel retornada");
      }

      const popup = window.open(data.url, "_blank", "noopener,noreferrer");
      if (!popup) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  }

  if (!canAccessDashboard) {
    const { label, helper, disabled } = onboardingCopy[status];

    return (
      <div className="space-y-3" data-status={status}>
        <Button
          onClick={handleOnboard}
          disabled={isLoading || disabled}
          className="w-full sm:w-auto gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          {label}
        </Button>
        <p className="text-xs text-muted-foreground">
          {helper}
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Não foi possível iniciar o onboarding</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-status={status}>
      <Button
        onClick={handleOpenDashboard}
        disabled={isLoading}
        className="w-full sm:w-auto gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        Abrir painel Stripe
      </Button>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível abrir o painel</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
