"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [isFree, setIsFree] = useState(!currentPriceCents || currentPriceCents === 0);
  const [priceValue, setPriceValue] = useState(
    currentPriceCents ? (currentPriceCents / 100).toFixed(2) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError(null);

    let price: number | null = null;

    if (!isFree) {
      price = parseFloat(priceValue);

      if (isNaN(price) || price < 1) {
        setValidationError("Preço mínimo é R$ 1,00");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/clubs/${clubId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha ao salvar preço");
      }

      toast.success("Preço atualizado com sucesso!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {currentPriceCents !== null && currentPriceCents !== undefined && (
        <p className="text-sm text-muted-foreground">
          Preço atual: <span className="font-medium text-foreground">
            {currentPriceCents > 0 ? `${formatCurrency(currentPriceCents)}/mês` : "Gratuito"}
          </span>
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Free club toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="isFree" className="text-base cursor-pointer">
              Clube gratuito
            </Label>
            <p className="text-sm text-muted-foreground">
              Qualquer pessoa pode entrar sem pagar
            </p>
          </div>
          <Switch
            id="isFree"
            checked={isFree}
            onCheckedChange={(checked) => {
              setIsFree(checked);
              if (checked) {
                setPriceValue("");
              }
            }}
          />
        </div>

        {/* Price input (only if not free) */}
        {!isFree && (
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
                required={!isFree}
              />
            </div>
          </div>
        )}

        {validationError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {validationError}
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
