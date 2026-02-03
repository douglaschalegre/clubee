"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Link2, Share2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventRsvpButtonsProps {
  clubId: string;
  eventId: string;
  initialStatus?: "going" | "not_going" | null;
  onStatusChange?: (status: "going" | "not_going") => void;
  isOrganizer?: boolean;
}

export function EventRsvpButtons({
  clubId,
  eventId,
  initialStatus = null,
  onStatusChange,
  isOrganizer = false,
}: EventRsvpButtonsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function updateRsvp(nextStatus: "going" | "not_going") {
    setIsUpdating(true);
    setError(null);

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

      let data: { error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Resposta JSON inválida: ${text.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || "Falha ao atualizar RSVP");
      }

      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsUpdating(false);
    }
  }

  function getEventUrl() {
    return `${window.location.origin}/clubs/${clubId}?event=${eventId}`;
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
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2">
        {/* RSVP toggle */}
        {!isOrganizer && (
          <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => updateRsvp("going")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-50",
                status === "going"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Check className="size-3.5" />
              Vou
            </button>
            <button
              type="button"
              disabled={isUpdating}
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
            className={cn(
              "text-muted-foreground",
              copied && "text-primary"
            )}
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
