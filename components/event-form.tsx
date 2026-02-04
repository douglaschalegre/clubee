"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { EventMapPreview } from "@/components/event-map-preview";
import { Ticket, UserCheck, Pencil, CreditCard } from "lucide-react";
import { toast } from "sonner";

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Belem", label: "Belém (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
  { value: "America/Noronha", label: "Noronha (GMT-2)" },
  { value: "America/New_York", label: "Nova York (GMT-5)" },
  { value: "America/Los_Angeles", label: "Los Angeles (GMT-8)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Europe/Lisbon", label: "Lisboa (GMT+0)" },
  { value: "Europe/Paris", label: "Paris (GMT+1)" },
  { value: "Asia/Tokyo", label: "Tóquio (GMT+9)" },
];

interface EventFormProps {
  clubId: string;
  eventId?: string;
  mode: "create" | "edit";
  initialData?: {
    title?: string;
    description?: string | null;
    startsAt?: string;
    timezone?: string;
    locationType?: "remote" | "physical";
    locationValue?: string;
    priceCents?: number | null;
    requiresApproval?: boolean;
    maxCapacity?: number | null;
  };
  onSaved?: () => void;
  stripeConnectActive?: boolean;
  settingsUrl?: string;
}

function parseInitialDateTime(startsAt?: string, timezone?: string) {
  if (!startsAt) return { date: "", time: "" };
  const d = new Date(startsAt);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const tz = timezone || "America/Sao_Paulo";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)!.value;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export function EventForm({
  clubId,
  eventId,
  mode,
  initialData,
  onSaved,
  stripeConnectActive,
  settingsUrl,
}: EventFormProps) {
  const initial = parseInitialDateTime(
    initialData?.startsAt,
    initialData?.timezone,
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [timezone, setTimezone] = useState(
    initialData?.timezone ?? "America/Sao_Paulo",
  );
  const [locationType, setLocationType] = useState<"remote" | "physical">(
    initialData?.locationType ?? "remote",
  );
  const [locationValue, setLocationValue] = useState(
    initialData?.locationValue ?? "",
  );
  const [price, setPrice] = useState<number | null>(
    initialData?.priceCents ? initialData.priceCents / 100 : null
  );
  const [priceInput, setPriceInput] = useState(
    initialData?.priceCents ? (initialData.priceCents / 100).toFixed(2) : ""
  );
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(
    initialData?.requiresApproval ?? false
  );
  const [maxCapacityInput, setMaxCapacityInput] = useState(
    initialData?.maxCapacity ? String(initialData.maxCapacity) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showStripeDialog, setShowStripeDialog] = useState(false);

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title ?? "");
      setDescription(initialData.description ?? "");
      const { date: newDate, time: newTime } = parseInitialDateTime(
        initialData.startsAt,
        initialData.timezone
      );
      setDate(newDate);
      setTime(newTime);
      setTimezone(initialData.timezone ?? "America/Sao_Paulo");
      setLocationType(initialData.locationType ?? "remote");
      setLocationValue(initialData.locationValue ?? "");
      setPrice(initialData.priceCents ? initialData.priceCents / 100 : null);
      setPriceInput(initialData.priceCents ? (initialData.priceCents / 100).toFixed(2) : "");
      setIsEditingPrice(false);
      setRequiresApproval(initialData.requiresApproval ?? false);
      setMaxCapacityInput(
        initialData.maxCapacity ? String(initialData.maxCapacity) : ""
      );
    }
  }, [initialData]);

  const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setValidationError(null);

    if (!date || !time) {
      setValidationError("Data e hora são obrigatórios");
      setIsSubmitting(false);
      return;
    }

    const startsAt = `${date}T${time}`;
    const trimmedCapacity = maxCapacityInput.trim();
    let maxCapacity: number | null = null;
    if (trimmedCapacity) {
      const parsed = Number(trimmedCapacity);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setValidationError("Capacidade deve ser um número inteiro a partir de 1");
        setIsSubmitting(false);
        return;
      }
      maxCapacity = parsed;
    }

    try {
      const payload = {
        title,
        description: description || undefined,
        startsAt,
        timezone,
        locationType,
        locationValue,
        price,
        requiresApproval,
        maxCapacity,
      };

      const res = await fetch(
        mode === "create"
          ? `/api/clubs/${clubId}/events`
          : `/api/clubs/${clubId}/events/${eventId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

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
        throw new Error(data.error || "Falha ao salvar evento");
      }

      toast.success(mode === "create" ? "Evento criado!" : "Evento atualizado!");
      onSaved?.();
      if (mode === "create") {
        setTitle("");
        setDescription("");
        setDate("");
        setTime("");
        setLocationValue("");
        setPrice(null);
        setPriceInput("");
        setIsEditingPrice(false);
        setRequiresApproval(false);
        setMaxCapacityInput("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
          {validationError}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Encontro da comunidade"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>
          Local <span className="text-destructive">*</span>
        </Label>
        <div className="space-y-3">
          <Tabs
            value={locationType}
            onValueChange={(v) => {
              setLocationType(v as "remote" | "physical");
              setLocationValue("");
            }}
          >
            <TabsList>
              <TabsTrigger value="remote">Remoto</TabsTrigger>
              <TabsTrigger value="physical">Presencial</TabsTrigger>
            </TabsList>
          </Tabs>
          {locationType === "remote" ? (
            <Input
              id="locationValue"
              value={locationValue}
              onChange={(event) => setLocationValue(event.target.value)}
              placeholder="Link da reunião (Zoom, Meet, etc.)"
              required
            />
          ) : mapApiKey ? (
            <LocationAutocomplete
              value={locationValue}
              onChange={setLocationValue}
              apiKey={mapApiKey}
            />
          ) : (
            <Input
              id="locationValue"
              value={locationValue}
              onChange={(event) => setLocationValue(event.target.value)}
              placeholder="Rua Exemplo, 123 - São Paulo"
              required
            />
          )}
        </div>
      </div>
      {locationType === "physical" && locationValue && (
        <EventMapPreview apiKey={mapApiKey} address={locationValue} />
      )}
      <div className="space-y-2">
        <Label htmlFor="description">
          Descrição <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">
            Data <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">
            Hora <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>
            Fuso horário <span className="text-destructive">*</span>
          </Label>
          <Select value={timezone} onValueChange={setTimezone} required>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Event options group */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Opções do evento</Label>
        <div className="rounded-lg border divide-y">
          {/* Price row */}
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Preço</span>
            </div>
            {isEditingPrice ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  onBlur={() => {
                    const val = parseFloat(priceInput);
                    if (!priceInput || isNaN(val) || val <= 0) {
                      setPrice(null);
                      setPriceInput("");
                    } else {
                      setPrice(val);
                    }
                    setIsEditingPrice(false);
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
                    setIsEditingPrice(true);
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>
                  {price && price > 0
                    ? `R$ ${price.toFixed(2).replace(".", ",")}`
                    : "Gratuito"}
                </span>
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Capacity row */}
          <div className="flex items-start justify-between gap-3 px-3 py-2.5">
            <div className="flex flex-col gap-0.5 text-sm">
              <span>Capacidade</span>
              <span className="text-xs text-muted-foreground">
                Deixe em branco para ilimitado
              </span>
            </div>
            <Input
              type="number"
              min="1"
              step="1"
              placeholder="--"
              value={maxCapacityInput}
              onChange={(e) => setMaxCapacityInput(e.target.value)}
              className="h-7 w-24 text-right text-sm px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* Approval row */}
          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Requer aprovação</span>
            </div>
            <Switch
              id="requiresApproval"
              checked={requiresApproval}
              onCheckedChange={setRequiresApproval}
            />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
        {isSubmitting
          ? mode === "create"
            ? "Criando..."
            : "Salvando..."
          : mode === "create"
            ? "Criar evento"
            : "Salvar alterações"}
      </Button>

      <Dialog open={showStripeDialog} onOpenChange={setShowStripeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configurar Stripe
            </DialogTitle>
            <DialogDescription>
              Para cobrar por eventos, você precisa configurar sua conta Stripe
              primeiro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStripeDialog(false)}
            >
              Cancelar
            </Button>
            {settingsUrl && (
              <Button asChild>
                <a href={settingsUrl}>Configurar Stripe</a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
