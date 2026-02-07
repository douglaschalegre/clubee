"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, Link2, Share2, X, Loader2 } from "lucide-react";
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
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isPaidEvent = priceCents && priceCents > 0;
  const isPendingPayment =
    status === "pending_payment" ||
    status === "approved_pending_payment" ||
    status === "payment_failed";
  const isFull =
    maxCapacity !== null &&
    maxCapacity !== undefined &&
    reservedCount >= maxCapacity;
  const hasReserved = isReservedStatus(status);
  const isPendingApproval = status === "pending_approval";
  const isApprovalConfirmed = requiresApproval && status === "going";
  const goingDisabled =
    isUpdating ||
    isPendingPayment ||
    isPendingApproval ||
    isApprovalConfirmed ||
    (isFull && !hasReserved);

  const goingLabel = useMemo(() => {
    if (status === "pending_approval") {
      return "Aguardando aprovação";
    }
    if (status === "going") {
      return "Confirmado";
    }
    if (status === "approved_pending_payment") {
      return "Aprovado";
    }
    if (status === "rejected") {
      return "Solicitar novamente";
    }
    if (status === "payment_failed") {
      return "Pagamento falhou";
    }
    if (requiresApproval) {
      return "Solicitar participação";
    }
    if (isPaidEvent) {
      return "Participar e pagar";
    }
    return "Vou";
  }, [requiresApproval, isPaidEvent, status]);

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

  return (
    <div className="space-y-2">
      {isPendingPayment && (
        <Button onClick={handlePayment} disabled={isUpdating} className="w-full">
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : status === "payment_failed" ? (
            "Tentar pagamento novamente"
          ) : (
            `Pagar - ${formatCurrency(priceCents!)}`
          )}
        </Button>
      )}
      <div className="flex items-center gap-2">
        {/* RSVP toggle */}
        {!isOrganizer && (
          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
            <button
              type="button"
              disabled={goingDisabled}
              onClick={() => updateRsvp("going")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-50 whitespace-nowrap",
                status === "going" ||
                  status === "pending_payment" ||
                  status === "pending_approval" ||
                  status === "approved_pending_payment" ||
                  status === "payment_failed"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              {goingLabel}
            </button>
            <button
              type="button"
              disabled={isUpdating || isPendingPayment}
              onClick={() => updateRsvp("not_going")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-50",
                status === "not_going"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <X className="size-3.5" />
              Não
            </button>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Share actions */}
        <div className="flex items-center gap-1">
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
  );
}
