"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Save, ArrowLeft, Image, Ticket, Pencil, Check, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface ClubFormProps {
  mode: "create" | "edit";
  initialData?: {
    name: string;
    description?: string | null;
    imageUrl?: string | null;
  };
  clubId?: string;
  membershipPriceCents?: number | null;
  stripeConnectActive?: boolean;
}

export function ClubForm({ mode, initialData, clubId, membershipPriceCents, stripeConnectActive }: ClubFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");

  // Pricing fields (only for create mode)
  const [isFreeClub, setIsFreeClub] = useState(true);
  const [priceValue, setPriceValue] = useState("");

  // Inline pricing for edit mode
  const [membershipPrice, setMembershipPrice] = useState<number | null>(
    membershipPriceCents ? membershipPriceCents / 100 : null
  );
  const [membershipPriceInput, setMembershipPriceInput] = useState(
    membershipPriceCents ? (membershipPriceCents / 100).toFixed(2) : ""
  );
  const [isEditingMembershipPrice, setIsEditingMembershipPrice] = useState(false);
  const [priceSaving, setPriceSaving] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [showStripeDialog, setShowStripeDialog] = useState(false);

  async function saveMembershipPrice(newPrice: number | null) {
    if (!clubId) return;
    setPriceSaving(true);
    try {
      const res = await fetch(`/api/clubs/${clubId}/pricing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price: newPrice }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Falha ao salvar preço");
      }
      setMembershipPrice(newPrice);
      setPriceSaved(true);
      setTimeout(() => setPriceSaved(false), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar preço");
      // Revert input to previous value
      setMembershipPriceInput(membershipPrice ? membershipPrice.toFixed(2) : "");
    } finally {
      setPriceSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationError(null);

    // Validate pricing for create mode
    let price: number | null = null;
    if (mode === "create" && !isFreeClub) {
      price = parseFloat(priceValue);
      if (isNaN(price) || price < 1) {
        setValidationError("Preço mínimo é R$ 1,00");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const url = mode === "create" ? "/api/clubs" : `/api/clubs/${clubId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const payload: Record<string, unknown> = {
        name,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
      };

      // Add pricing only in create mode
      if (mode === "create") {
        payload.membershipPrice = price;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
          throw new Error(data.error || "Algo deu errado");
      }

      const data = await res.json();
      toast.success(mode === "create" ? "Clube criado!" : "Alterações salvas!");
      router.push(`/clubs/${data.club.id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          {validationError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nome do clube <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Meu clube incrível"
          required
          maxLength={100}
          className="h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Descrição
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Sobre o que é seu clube? Compartilhe sua missão e o que os membros podem esperar..."
          maxLength={500}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {description.length}/500 caracteres
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="text-sm font-medium flex items-center gap-2">
          <Image className="h-4 w-4 text-muted-foreground" />
          URL da imagem
        </Label>
        <Input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          Deixe em branco para usar um avatar gerado com base no nome do clube.
        </p>
      </div>

      {/* Pricing (only in create mode) */}
      {mode === "create" && (
        <>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="isFreeClub" className="text-base cursor-pointer">
                Clube gratuito
              </Label>
              <p className="text-sm text-muted-foreground">
                Qualquer pessoa pode entrar sem pagar
              </p>
            </div>
            <Switch
              id="isFreeClub"
              checked={isFreeClub}
              onCheckedChange={(checked) => {
                setIsFreeClub(checked);
                if (checked) {
                  setPriceValue("");
                }
              }}
            />
          </div>

          {!isFreeClub && (
            <div className="space-y-2">
              <Label htmlFor="clubPrice" className="text-sm font-medium">
                Preço mensal (R$) <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  R$
                </span>
                <Input
                  id="clubPrice"
                  type="number"
                  step="0.01"
                  min="1.00"
                  placeholder="29.90"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  className="pl-10 h-11"
                  required={!isFreeClub}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo R$ 1,00/mês
              </p>
            </div>
          )}
        </>
      )}

      {/* Membership pricing (edit mode) */}
      {mode === "edit" && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Opções do clube</Label>
          <div className="rounded-lg border divide-y">
            <div className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex items-center gap-2.5 text-sm">
                <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Preço da membresia</span>
              </div>
              {isEditingMembershipPrice ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={membershipPriceInput}
                    onChange={(e) => setMembershipPriceInput(e.target.value)}
                    onBlur={() => {
                      const val = parseFloat(membershipPriceInput);
                      const newPrice = (!membershipPriceInput || isNaN(val) || val <= 0) ? null : val;
                      setIsEditingMembershipPrice(false);
                      if (newPrice !== membershipPrice) {
                        if (!newPrice) setMembershipPriceInput("");
                        saveMembershipPrice(newPrice);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    autoFocus
                    className="h-7 w-24 text-right text-sm px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!stripeConnectActive) {
                      setShowStripeDialog(true);
                    } else {
                      setIsEditingMembershipPrice(true);
                    }
                  }}
                  disabled={priceSaving}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {priceSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : priceSaved ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : null}
                  <span>
                    {membershipPrice && membershipPrice > 0
                      ? `R$ ${membershipPrice.toFixed(2).replace(".", ",")}/mês`
                      : "Gratuito"}
                  </span>
                  {!priceSaving && !priceSaved && <Pencil className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="gap-2 shadow-honey transition-all hover:shadow-honey-lg sm:flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
               {mode === "create" ? "Criando..." : "Salvando..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
               {mode === "create" ? "Criar clube" : "Salvar alterações"}
            </>
          )}
        </Button>
      </div>

      <Dialog open={showStripeDialog} onOpenChange={setShowStripeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configurar Stripe
            </DialogTitle>
            <DialogDescription>
              Para cobrar pela membresia, você precisa configurar sua conta
              Stripe primeiro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStripeDialog(false)}
            >
              Cancelar
            </Button>
            {clubId && (
              <Button asChild>
                <a href={`/clubs/${clubId}/settings`}>Configurar Stripe</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
