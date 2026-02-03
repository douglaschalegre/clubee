"use client";

import { useState } from "react";
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
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { EventMapPreview } from "@/components/event-map-preview";

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
  };
  onSaved?: () => void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!date || !time) {
      setError("Data e hora são obrigatórios");
      setIsSubmitting(false);
      return;
    }

    const startsAt = `${date}T${time}`;

    try {
      const payload = {
        title,
        description: description || undefined,
        startsAt,
        timezone,
        locationType,
        locationValue,
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

      onSaved?.();
      if (mode === "create") {
        setTitle("");
        setDescription("");
        setDate("");
        setTime("");
        setLocationValue("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
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
      <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
        {isSubmitting
          ? mode === "create"
            ? "Criando..."
            : "Salvando..."
          : mode === "create"
            ? "Criar evento"
            : "Salvar alterações"}
      </Button>
    </form>
  );
}
