"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface EventRsvpButtonsProps {
  clubId: string;
  eventId: string;
  initialStatus?: "going" | "not_going" | null;
}

export function EventRsvpButtons({
  clubId,
  eventId,
  initialStatus = null,
}: EventRsvpButtonsProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={status === "going" ? "default" : "outline"}
          disabled={isUpdating}
          onClick={() => updateRsvp("going")}
        >
          Vou
        </Button>
        <Button
          size="sm"
          variant={status === "not_going" ? "default" : "outline"}
          disabled={isUpdating}
          onClick={() => updateRsvp("not_going")}
        >
          Não vou
        </Button>
      </div>
    </div>
  );
}
