"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";

interface ClubPricingFormProps {
  clubId: string;
  currentPriceCents: number | null;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ClubPricingForm({
  clubId,
  currentPriceCents,
}: ClubPricingFormProps) {
  const [priceValue, setPriceValue] = useState(
    currentPriceCents ? (currentPriceCents / 100).toFixed(2) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const cents = Math.round(parseFloat(priceValue) * 100);

    if (isNaN(cents) || cents < 100) {
      setError("Preço mínimo é R$ 1,00");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/clubs/${clubId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceCents: cents }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao salvar preço");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {currentPriceCents && (
        <p className="text-sm text-muted-foreground">
          Preço atual: <span className="font-medium text-foreground">{formatCurrency(currentPriceCents)}/mês</span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="price">Preço mensal (R$)</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="1.00"
              placeholder="29.90"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Check className="h-4 w-4" />
            Preço atualizado com sucesso
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            currentPriceCents ? "Atualizar preço" : "Definir preço"
          )}
        </Button>
      </form>
    </div>
  );
}
