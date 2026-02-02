"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventFormProps {
  clubId: string;
  eventId?: string;
  mode: "create" | "edit";
  initialData?: {
    title?: string;
    description?: string | null;
    startsAt?: string;
    endsAt?: string | null;
    timezone?: string;
    locationType?: "remote" | "physical";
    locationValue?: string;
    locationPlaceId?: string | null;
    locationLat?: number | null;
    locationLng?: number | null;
  };
  onSaved?: () => void;
}

export function EventForm({
  clubId,
  eventId,
  mode,
  initialData,
  onSaved,
}: EventFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [startsAt, setStartsAt] = useState(initialData?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initialData?.endsAt ?? "");
  const [timezone, setTimezone] = useState(initialData?.timezone ?? "America/Sao_Paulo");
  const [locationType, setLocationType] = useState<"remote" | "physical">(
    initialData?.locationType ?? "remote"
  );
  const [locationValue, setLocationValue] = useState(initialData?.locationValue ?? "");
  const [locationPlaceId, setLocationPlaceId] = useState(initialData?.locationPlaceId ?? "");
  const [locationLat, setLocationLat] = useState<string>(
    initialData?.locationLat != null ? String(initialData.locationLat) : ""
  );
  const [locationLng, setLocationLng] = useState<string>(
    initialData?.locationLng != null ? String(initialData.locationLng) : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        title,
        description: description || undefined,
        startsAt,
        endsAt: endsAt || undefined,
        timezone,
        locationType,
        locationValue,
        locationPlaceId: locationPlaceId || undefined,
        locationLat: locationLat ? Number(locationLat) : undefined,
        locationLng: locationLng ? Number(locationLng) : undefined,
      };

      const res = await fetch(
        mode === "create"
          ? `/api/clubs/${clubId}/events`
          : `/api/clubs/${clubId}/events/${eventId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
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
        setStartsAt("");
        setEndsAt("");
        setLocationValue("");
        setLocationPlaceId("");
        setLocationLat("");
        setLocationLng("");
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
        <Label htmlFor="title">Título do evento</Label>
        <Input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Encontro da comunidade"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Início</Label>
          <Input
            id="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endsAt">Fim</Label>
          <Input
            id="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="timezone">Fuso horário</Label>
        <Input
          id="timezone"
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          placeholder="America/Sao_Paulo"
        />
      </div>
      <div className="space-y-2">
        <Label>Tipo de local</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={locationType === "remote" ? "default" : "outline"}
            onClick={() => setLocationType("remote")}
          >
            Remoto
          </Button>
          <Button
            type="button"
            size="sm"
            variant={locationType === "physical" ? "default" : "outline"}
            onClick={() => setLocationType("physical")}
          >
            Presencial
          </Button>
        </div>
        {locationType === "remote" ? (
          <p className="text-xs text-muted-foreground">
            Se tiver um link de evento virtual, você pode colar abaixo.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Informe o endereço completo. O mapa será exibido após a seleção.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="locationValue">Local</Label>
        <Input
          id="locationValue"
          value={locationValue}
          onChange={(event) => setLocationValue(event.target.value)}
          placeholder={
            locationType === "remote"
              ? "https://meet.google.com/"
              : "Rua Exemplo, 123 - São Paulo"
          }
          required
        />
      </div>
      {locationType === "physical" && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Selecione o endereço usando o buscador do Google Maps.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="locationPlaceId">Place ID</Label>
              <Input
                id="locationPlaceId"
                value={locationPlaceId}
                onChange={(event) => setLocationPlaceId(event.target.value)}
                placeholder="ChIJ..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationLat">Latitude</Label>
              <Input
                id="locationLat"
                value={locationLat}
                onChange={(event) => setLocationLat(event.target.value)}
                placeholder="-23.55"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationLng">Longitude</Label>
              <Input
                id="locationLng"
                value={locationLng}
                onChange={(event) => setLocationLng(event.target.value)}
                placeholder="-46.63"
                required
              />
            </div>
          </div>
        </div>
      )}
      <Button type="submit" disabled={isSubmitting} className="gap-2">
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
