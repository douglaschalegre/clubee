"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

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
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
  }
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

const statusSummary: Record<ConnectStatus, string> = {
  not_started:
    "Conecte sua conta Stripe para habilitar pagamentos seguros no seu clube.",
  onboarding_started:
    "Seu onboarding já começou. Faltam poucos passos para liberar recebimentos.",
  onboarding_incomplete:
    "Existem informações pendentes para concluir o onboarding.",
  active: "Conta conectada. Os pagamentos já estão habilitados.",
  restricted:
    "Há pendências no Stripe que limitam o recebimento de pagamentos.",
  disabled: "A conta Stripe está desativada no momento. É necessário suporte.",
};

const nextCardCopy: Record<ConnectStatus, { title: string; body: string }> = {
  not_started: {
    title: "O que acontece em seguida",
    body: "Você será redirecionado ao Stripe para informar dados da organização e conta bancária.",
  },
  onboarding_started: {
    title: "Finalize o onboarding",
    body: "Complete as informações pendentes para liberar os pagamentos.",
  },
  onboarding_incomplete: {
    title: "Finalize o onboarding",
    body: "Complete as informações pendentes para liberar os pagamentos.",
  },
  active: {
    title: "Gerencie recebimentos",
    body: "Acompanhe saldos, repasses e relatórios direto no painel do Stripe.",
  },
  restricted: {
    title: "Resolver pendencias",
    body: "Acesse o Stripe para revisar exigências e restabelecer pagamentos.",
  },
  disabled: {
    title: "Contate o suporte",
    body: "A conta foi desativada. É preciso falar com o Stripe para reativar.",
  },
};

const stepLabels = [
  "Conectar conta",
  "Concluir onboarding",
  "Pronto para pagamentos",
];

const stepIndexByStatus: Record<ConnectStatus, number> = {
  not_started: 0,
  onboarding_started: 1,
  onboarding_incomplete: 1,
  active: 2,
  restricted: 1,
  disabled: 0,
};

export function StripeConnectBadge({
  status,
  className,
}: {
  status: ConnectStatus;
  className?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        "gap-1.5 px-3 py-1 text-xs font-semibold tracking-wide shadow-honey",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

export function StripeConnectSetup({
  clubId,
  status,
}: StripeConnectSetupProps) {
  const [isLoading, setIsLoading] = useState(false);

  const currentStep = stepIndexByStatus[status];
  const isActive = status === "active";
  const isDisabled = status === "disabled";
  const showCaution = status === "restricted" || status === "disabled";

  async function handleOnboard() {
    setIsLoading(true);

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
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
      setIsLoading(false);
    }
  }

  async function handleDashboard() {
    setIsLoading(true);

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
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative overflow-hidden rounded-2xl border bg-card/80 p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_oklch(0.98_0.02_95/0.7)_0%,_transparent_60%)] opacity-60" />
        <div className="pointer-events-none absolute inset-0 pattern-honeycomb opacity-30" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <StripeConnectBadge status={status} />
            {status === "active" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-honey/30 bg-honey/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
                <ShieldCheck className="h-3.5 w-3.5" />
                Seguro
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {statusSummary[status]}
          </p>

          <div className="relative overflow-hidden rounded-xl border bg-background/70 p-4">
            <div className="pointer-events-none absolute left-4 top-4 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-honey/80 via-amber/50 to-transparent" />
            <ul className="stagger-in space-y-3 pl-6">
              {stepLabels.map((label, index) => {
                const isComplete = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <li key={label} className="flex items-start gap-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                        isComplete
                          ? "border-honey/60 bg-honey/20 text-foreground"
                          : isCurrent
                            ? "border-honey bg-honey text-foreground shadow-honey"
                            : "border-border bg-muted/40 text-muted-foreground",
                      )}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm",
                        isCurrent
                          ? "font-semibold text-foreground"
                          : isComplete
                            ? "text-foreground/80"
                            : "text-muted-foreground",
                      )}
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {showCaution && (
            <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>
                {status === "restricted"
                  ? "Há exigências pendentes. Resolva no Stripe para voltar a receber."
                  : "Conta desativada. Entre em contato com o suporte do Stripe."}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border bg-muted/30 p-6">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">
            Ações principais
          </h3>
          <p className="text-sm text-muted-foreground">
            {isActive
              ? "Gerencie sua conta e acompanhe os pagamentos no Stripe."
              : "Finalize o onboarding para liberar os pagamentos do clube."}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant={isActive ? "outline" : "default"}
            onClick={isActive ? handleDashboard : handleOnboard}
            disabled={isLoading || isDisabled}
            className="w-full justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            {isActive
              ? "Abrir painel Stripe"
              : status === "not_started"
                ? "Conectar com Stripe"
                : "Continuar configuração"}
          </Button>
          <div className="rounded-xl border border-amber/30 bg-amber/10 p-4 text-sm text-foreground/90">
            <p className="text-sm font-semibold">
              {nextCardCopy[status].title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {nextCardCopy[status].body}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            Pagamentos processados pelo Stripe com segurança.
          </div>
        </div>
      </div>
    </div>
  );
}
