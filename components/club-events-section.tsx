"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventDeleteButton } from "@/components/event-delete-button";
import { EventForm } from "@/components/event-form";
import { EventMapPreview } from "@/components/event-map-preview";
import { EventRsvpButtons } from "@/components/event-rsvp-buttons";
import { CalendarDays, Clock, MapPin, Plus, Video, X } from "lucide-react";

type EventSummary = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  timezone: string;
  locationType?: "remote" | "physical" | null;
  locationValue?: string | null;
  locationPlaceId?: string | null;
  rsvpCount: number;
  rsvpStatus?: "going" | "not_going" | null;
};

interface ClubEventsSectionProps {
  clubId: string;
  events: EventSummary[];
  isOrganizer: boolean;
  canViewEventDetails: boolean;
  mapApiKey?: string | null;
  isLoggedIn: boolean;
}

export function ClubEventsSection({
  clubId,
  events,
  isOrganizer,
  canViewEventDetails,
  mapApiKey,
  isLoggedIn,
}: ClubEventsSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
  });

  const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
  });

  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleSaved() {
    setShowForm(false);
    router.refresh();
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-6 sm:p-8">
      <div className="absolute inset-0 pattern-honeycomb opacity-30" />
      <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-amber/10 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Eventos
              </h2>
              <p className="text-sm text-muted-foreground">
                {events.length} {events.length === 1 ? "evento" : "eventos"} programados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOrganizer && (
              <Button
                type="button"
                className="gap-2"
                onClick={() => setShowForm((value) => !value)}
              >
                {showForm ? (
                  <>
                    <X className="h-4 w-4" />
                    Fechar
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Criar evento
                  </>
                )}
              </Button>
            )}
            {!isLoggedIn && (
              <Button asChild variant="outline" className="gap-2">
                <a href="/auth/login">Ver detalhes</a>
              </Button>
            )}
          </div>
        </div>

        {isOrganizer && showForm && (
          <Card className="border border-border/60 bg-background/80">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Criar evento</CardTitle>
              <CardDescription>
                Convide os membros para encontros presenciais e online.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <EventForm clubId={clubId} mode="create" onSaved={handleSaved} />
            </CardContent>
          </Card>
        )}

        {events.length === 0 ? (
          <Card className="border border-border/60 bg-background/80">
            <CardContent className="p-6 text-sm text-muted-foreground">
              Nenhum evento agendado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-2 h-full w-px bg-border/60" />
            <div className="space-y-6">
              {events.map((event) => {
                const startDate = new Date(event.startsAt);
                const endDate = event.endsAt ? new Date(event.endsAt) : null;
                const dateLabel = formatter.format(startDate);
                const weekdayLabel = weekdayFormatter.format(startDate);
                const timeLabel = `${timeFormatter.format(startDate)}${endDate ? ` – ${timeFormatter.format(endDate)}` : ""}`;

                return (
                  <div key={event.id} className="relative pl-14">
                    <div className="absolute left-[18px] top-2 h-4 w-4 rounded-full border-2 border-primary bg-background shadow" />
                    <div className="grid gap-4 rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-start">
                            <span className="text-sm uppercase tracking-wide text-muted-foreground">
                              {dateLabel}
                            </span>
                            <span className="text-sm font-semibold capitalize" style={{ fontFamily: "var(--font-display)" }}>
                              {weekdayLabel}
                            </span>
                          </div>
                          <div className="h-10 w-px bg-border/60" />
                          <div>
                            <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                              {event.title}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {timeLabel}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2 py-0.5 text-xs">
                                {event.timezone}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="rounded-full border border-border/60 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              {event.rsvpCount} {event.rsvpCount === 1 ? "confirmação" : "confirmações"}
                            </span>
                          {isOrganizer && (
                            <EventDeleteButton
                              clubId={clubId}
                              eventId={event.id}
                              eventTitle={event.title}
                            />
                          )}
                        </div>
                      </div>

                      {canViewEventDetails ? (
                        <div className="grid gap-3 text-sm text-muted-foreground">
                          {event.description && (
                            <p className="leading-relaxed">{event.description}</p>
                          )}
                          {event.locationType && event.locationValue && (
                            <div className="inline-flex items-center gap-2">
                              {event.locationType === "remote" ? (
                                <Video className="h-4 w-4" />
                              ) : (
                                <MapPin className="h-4 w-4" />
                              )}
                              <span>{event.locationValue}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Faça login e assine para ver os detalhes do evento.
                        </p>
                      )}

                      {canViewEventDetails && event.locationType === "physical" && (
                        <EventMapPreview apiKey={mapApiKey} placeId={event.locationPlaceId} />
                      )}

                      {canViewEventDetails && !isOrganizer && (
                        <EventRsvpButtons
                          clubId={clubId}
                          eventId={event.id}
                          initialStatus={event.rsvpStatus ?? null}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
