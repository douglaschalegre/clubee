"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  Link2,
  Loader2,
  Share2,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { isReservedStatus } from "@/lib/event-capacity";
import { toast } from "sonner";

type RsvpStatus =
  | "going"
  | "not_going"
  | "pending_payment"
  | "pending_approval"
  | "approved_pending_payment"
  | "rejected"
  | "payment_failed"
  | null;

type Tone = "neutral" | "success" | "warning" | "info" | "danger";

type RsvpUiState = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: Tone;
  primaryLabel: string;
  primaryAction: "rsvp" | "pay" | "none";
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  secondaryAction?: "not_going";
  secondaryDisabled?: boolean;
  secondaryTooltip?: string;
};

interface EventRsvpButtonsProps {
  clubId: string;
  eventId: string;
  initialStatus?: RsvpStatus;
  onStatusChange?: (status: RsvpStatus) => void;
  isOrganizer?: boolean;
  priceCents?: number | null;
  requiresApproval?: boolean;
  reservedCount?: number;
  maxCapacity?: number | null;
}

const NO_CANCEL_TOOLTIP = "Pagamentos não podem ser cancelados no app";

function getRsvpUiState({
  status,
  isPaidEvent,
  requiresApproval,
  priceCents,
}: {
  status: RsvpStatus;
  isPaidEvent: boolean;
  requiresApproval: boolean;
  priceCents?: number | null;
}): RsvpUiState {
  const payLabel = priceCents
    ? `Pagar agora · ${formatCurrency(priceCents)}`
    : "Pagar agora";
  const approvalSubtitle = "Sua solicitação passará por aprovação.";

  if (status === "pending_payment" || status === "approved_pending_payment") {
    return {
      title: "Pagamento pendente",
      subtitle: "Finalize para confirmar sua presença.",
      icon: CreditCard,
      tone: "warning",
      primaryLabel: payLabel,
      primaryAction: "pay",
      secondaryLabel: "Cancelar",
      secondaryAction: "not_going",
      secondaryDisabled: true,
      secondaryTooltip: NO_CANCEL_TOOLTIP,
    };
  }

  if (status === "payment_failed") {
    return {
      title: "Pagamento falhou",
      subtitle: "Tente novamente para confirmar.",
      icon: AlertTriangle,
      tone: "danger",
      primaryLabel: "Tentar pagamento novamente",
      primaryAction: "pay",
      secondaryLabel: "Cancelar",
      secondaryAction: "not_going",
      secondaryDisabled: true,
      secondaryTooltip: NO_CANCEL_TOOLTIP,
    };
  }

  if (status === "pending_approval") {
    return {
      title: "Aguardando aprovação",
      subtitle: "Você pode cancelar enquanto espera.",
      icon: Clock,
      tone: "info",
      primaryLabel: "Aguardando aprovação",
      primaryAction: "none",
      primaryDisabled: true,
      secondaryLabel: "Cancelar solicitação",
      secondaryAction: "not_going",
    };
  }

  if (status === "rejected") {
    return {
      title: "Solicitação negada",
      subtitle: "Você pode solicitar novamente.",
      icon: XCircle,
      tone: "danger",
      primaryLabel: "Solicitar novamente",
      primaryAction: "rsvp",
      secondaryLabel: "Não vou",
      secondaryAction: "not_going",
    };
  }

  if (status === "going") {
    return {
      title: "Presença confirmada",
      subtitle: isPaidEvent ? "Pagamento confirmado." : "Você está na lista.",
      icon: CheckCircle2,
      tone: "success",
      primaryLabel: "Presença confirmada",
      primaryAction: "none",
      primaryDisabled: true,
      secondaryLabel: isPaidEvent ? "Cancelar" : "Cancelar presença",
      secondaryAction: "not_going",
      secondaryDisabled: isPaidEvent,
      secondaryTooltip: isPaidEvent ? NO_CANCEL_TOOLTIP : undefined,
    };
  }

  return {
    title: requiresApproval ? "Solicitação de participação" : "Confirmar presença",
    subtitle: requiresApproval
      ? approvalSubtitle
      : isPaidEvent
        ? "Pagamento necessário para confirmar."
        : "Garanta sua vaga.",
    icon: Circle,
    tone: "neutral",
    primaryLabel: isPaidEvent ? "Participar e pagar" : "Confirmar presença",
    primaryAction: "rsvp",
    secondaryLabel: "Não vou",
    secondaryAction: "not_going",
  };
}

export function EventRsvpButtons({
  clubId,
  eventId,
  initialStatus = null,
  onStatusChange,
  isOrganizer = false,
  priceCents,
  requiresApproval,
  reservedCount = 0,
  maxCapacity,
}: EventRsvpButtonsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPaidEvent = (priceCents ?? 0) > 0;
  const needsApproval = Boolean(requiresApproval);
  const isFull =
    maxCapacity !== null &&
    maxCapacity !== undefined &&
    reservedCount >= maxCapacity;
  const hasReserved = isReservedStatus(status);
  const capacityBlocked = isFull && !hasReserved;

  const uiState = useMemo(() => {
    const state = getRsvpUiState({
      status,
      isPaidEvent,
      requiresApproval: needsApproval,
      priceCents,
    });

    if (capacityBlocked && state.primaryAction !== "none") {
      return {
        ...state,
        subtitle: "Evento lotado",
        primaryDisabled: true,
      };
    }

    return state;
  }, [capacityBlocked, isPaidEvent, needsApproval, priceCents, status]);

  const toneClasses: Record<Tone, { accent: string; icon: string; iconBg: string }> = {
    neutral: {
      accent: "bg-border/70",
      icon: "text-muted-foreground",
      iconBg: "bg-muted",
    },
    success: {
      accent: "bg-emerald-400/80",
      icon: "text-emerald-700 dark:text-emerald-300",
      iconBg: "bg-emerald-100/70 dark:bg-emerald-950/40",
    },
    warning: {
      accent: "bg-amber-400/80",
      icon: "text-amber-700 dark:text-amber-300",
      iconBg: "bg-amber-100/70 dark:bg-amber-950/40",
    },
    info: {
      accent: "bg-sky-400/80",
      icon: "text-sky-700 dark:text-sky-300",
      iconBg: "bg-sky-100/70 dark:bg-sky-950/40",
    },
    danger: {
      accent: "bg-rose-400/80",
      icon: "text-rose-700 dark:text-rose-300",
      iconBg: "bg-rose-100/70 dark:bg-rose-950/40",
    },
  };

  async function updateRsvp(nextStatus: "going" | "not_going") {
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/clubs/${clubId}/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const text = await res.text();
      if (!text) {
        throw new Error(`Resposta vazia do servidor (status: ${res.status})`);
      }

      let data: {
        error?: string;
        rsvp?: { status: RsvpStatus };
        requiresApproval?: boolean;
        requiresPayment?: boolean;
      };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta JSON inválida: ${text.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Falha ao atualizar RSVP");
      }

      const newStatus: RsvpStatus = data.rsvp?.status || nextStatus;
      setStatus(newStatus);
      onStatusChange?.(newStatus);

      if (data.requiresPayment && !data.requiresApproval) {
        // Redirect to checkout immediately for paid events
        handlePayment();
      } else if (newStatus === "going") {
        toast.success("Presença confirmada!");
      } else if (newStatus === "not_going") {
        toast.success("RSVP cancelado.");
      } else if (newStatus === "pending_approval") {
        toast.success("Solicitação enviada!");
      }
      // For other cases, the status change is enough (UI will update via drawer)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handlePayment() {
    setIsUpdating(true);

    try {
      const res = await fetch(
        `/api/clubs/${clubId}/events/${eventId}/checkout`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Falha ao criar checkout");
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao processar pagamento"
      );
      setIsUpdating(false);
    }
  }

  function getEventUrl() {
    return `${window.location.origin}/clubs/${clubId}?eventId=${eventId}`;
  }

  async function copyLink() {
    const url = getEventUrl();
    if (window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        // clipboard API failed even on secure context
      }
    } else {
      const input = document.createElement("input");
      input.value = url;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.focus();
      input.setSelectionRange(0, url.length);
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareEvent() {
    if (window.isSecureContext && navigator.share) {
      const url = getEventUrl();
      navigator.share({ url }).catch(() => {
        // user cancelled
      });
    } else {
      copyLink();
    }
  }

  if (isOrganizer) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={copyLink}
          title={copied ? "Link copiado!" : "Copiar link"}
          className={cn("text-muted-foreground", copied && "text-primary")}
        >
          <Link2 className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={shareEvent}
          title="Compartilhar"
          className="text-muted-foreground"
        >
          <Share2 className="size-4" />
        </Button>
      </div>
    );
  }

  const primaryDisabled =
    Boolean(uiState.primaryDisabled) || isUpdating || capacityBlocked;
  const secondaryDisabled = Boolean(uiState.secondaryDisabled) || isUpdating;
  const tone = toneClasses[uiState.tone];

  const renderSecondaryButton = () => {
    if (!uiState.secondaryLabel) return null;

    const button = (
      <Button
        type="button"
        size="xs"
        variant="ghost"
        disabled={secondaryDisabled}
        onClick={() => {
          if (uiState.secondaryAction === "not_going") {
            updateRsvp("not_going");
          }
        }}
      >
        {uiState.secondaryLabel}
      </Button>
    );

    if (uiState.secondaryTooltip && secondaryDisabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex" tabIndex={0}>
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent>{uiState.secondaryTooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative rounded-xl border border-border/60 bg-muted/40 p-3">
        <span
          className={cn("absolute inset-y-2 left-0 w-1 rounded-full", tone.accent)}
        />
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              tone.iconBg
            )}
          >
            <uiState.icon className={cn("size-4", tone.icon)} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {uiState.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {uiState.subtitle}
            </p>
          </div>
          <div className="ml-auto">
            <Button
              type="button"
              size="sm"
              variant={primaryDisabled ? "secondary" : "default"}
              disabled={primaryDisabled}
              onClick={() => {
                if (uiState.primaryAction === "rsvp") {
                  updateRsvp("going");
                }
                if (uiState.primaryAction === "pay") {
                  handlePayment();
                }
              }}
              className="min-w-[150px]"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                uiState.primaryLabel
              )}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {renderSecondaryButton()}
          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={copyLink}
              title={copied ? "Link copiado!" : "Copiar link"}
              className={cn("text-muted-foreground", copied && "text-primary")}
            >
              <Link2 className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={shareEvent}
              title="Compartilhar"
              className="text-muted-foreground"
            >
              <Share2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
