"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

type ConnectStatus =
  | "not_started"
  | "onboarding_started"
  | "onboarding_incomplete"
  | "active"
  | "restricted"
  | "disabled";

interface StripeConnectSetupProps {
  clubId: string;
  status: ConnectStatus;
}

const statusConfig: Record<
  ConnectStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  not_started: {
    label: "Não configurado",
    variant: "secondary",
    icon: AlertCircle,
  },
  onboarding_started: {
    label: "Onboarding iniciado",
    variant: "outline",
    icon: AlertCircle,
  },
  onboarding_incomplete: {
    label: "Onboarding incompleto",
    variant: "outline",
    icon: AlertCircle,
  },
  active: {
    label: "Ativo",
    variant: "default",
    icon: CheckCircle2,
  },
  restricted: {
    label: "Restrito",
    variant: "destructive",
    icon: AlertCircle,
  },
  disabled: {
    label: "Desativado",
    variant: "destructive",
    icon: AlertCircle,
  },
};

export function StripeConnectSetup({ clubId, status }: StripeConnectSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = statusConfig[status];
  const Icon = config.icon;

  async function handleOnboard() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao iniciar onboarding");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
      setIsLoading(false);
    }
  }

  async function handleDashboard() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/connect/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao abrir painel");
      }

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={config.variant} className="gap-1.5">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {status === "active" ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sua conta Stripe está conectada e pronta para receber pagamentos.
          </p>
          <Button
            variant="outline"
            onClick={handleDashboard}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Abrir painel Stripe
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {status === "not_started"
              ? "Conecte sua conta Stripe para receber pagamentos dos membros do seu clube."
              : status === "restricted"
                ? "Sua conta tem restrições. Acesse o Stripe para resolver pendências."
                : status === "disabled"
                  ? "Sua conta foi desativada. Entre em contato com o suporte."
                  : "Complete o onboarding para começar a receber pagamentos."}
          </p>
          <Button
            onClick={handleOnboard}
            disabled={isLoading || status === "disabled"}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {status === "not_started"
              ? "Conectar com Stripe"
              : "Continuar configuração"}
          </Button>
        </div>
      )}
    </div>
  );
}
