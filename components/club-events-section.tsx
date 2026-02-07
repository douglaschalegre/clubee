"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EventForm } from "@/components/event-form";
import {
  EventDetailDrawer,
  type DrawerEvent,
} from "@/components/event-detail-drawer";
import { CalendarDays, MapPin, Plus, Users, Video } from "lucide-react";
import { getRsvpStatusBadge } from "@/lib/event-rsvp-ui";

type EventCreator = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type EventSummary = {
  id: string;
  title: string;
  description?: string | null;
  startsAt: Date | string;
  timezone: string;
  locationType?: "remote" | "physical" | null;
  locationValue?: string | null;
  reservedCount: number;
  maxCapacity?: number | null;
  rsvpStatus?:
    | "going"
    | "not_going"
    | "pending_payment"
    | "pending_approval"
    | "approved_pending_payment"
    | "rejected"
    | "payment_failed"
    | null;
  createdBy?: EventCreator | null;
  priceCents?: number | null;
  requiresApproval?: boolean;
  userPaidAt?: Date | null;
};

interface ClubEventsSectionProps {
  clubId: string;
  events: EventSummary[];
  isOrganizer: boolean;
  canViewEventDetails: boolean;
  mapApiKey?: string | null;
  isLoggedIn: boolean;
  stripeConnectActive?: boolean;
}

export function ClubEventsSection({
  clubId,
  events,
  isOrganizer,
  canViewEventDetails,
  mapApiKey,
  isLoggedIn,
  stripeConnectActive,
}: ClubEventsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DrawerEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Auto-open drawer when event parameter is present in URL
  useEffect(() => {
    const eventId = searchParams.get("event");
    if (eventId) {
      const matchingEvent = events.find((e) => e.id === eventId);
      if (matchingEvent) {
        openDrawer(matchingEvent);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  function formatDate(date: Date, tz: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "short",
      timeZone: tz,
    }).format(date);
  }

  function formatTime(date: Date, tz: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
    }).format(date);
  }

  function handleSaved() {
    setDialogOpen(false);
    router.refresh();
  }

  function openDrawer(event: EventSummary) {
    setSelectedEvent(event);
    setDrawerOpen(true);

    // Update URL without page reload
    const params = new URLSearchParams(window.location.search);
    params.set("event", event.id);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleDrawerClose(open: boolean) {
    setDrawerOpen(open);
    if (!open) {
      setSelectedEvent(null);

      // Remove event parameter from URL
      const params = new URLSearchParams(window.location.search);
      params.delete("event");
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
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
                {events.length} {events.length === 1 ? "evento" : "eventos"}{" "}
                programados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOrganizer && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Criar evento</DialogTitle>
                    <DialogDescription>
                      Convide os membros para encontros presenciais e online.
                    </DialogDescription>
                  </DialogHeader>
                  <EventForm
                    clubId={clubId}
                    mode="create"
                    onSaved={handleSaved}
                    stripeConnectActive={stripeConnectActive}
                    settingsUrl={`/clubs/${clubId}/settings#pagamentos`}
                  />
                </DialogContent>
              </Dialog>
            )}
            {!isLoggedIn && (
              <Button asChild variant="outline" className="gap-2">
                <a href="/auth/login">Ver detalhes</a>
              </Button>
            )}
          </div>
        </div>

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
              const dateLabel = formatDate(startDate, event.timezone);
              const timeLabel = formatTime(startDate, event.timezone);
              const isFull =
                event.maxCapacity !== null &&
                event.maxCapacity !== undefined &&
                event.reservedCount >= event.maxCapacity;
              const creatorInitials = event.createdBy?.name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              const statusBadge = getRsvpStatusBadge(event.rsvpStatus ?? null);

              return (
                <div key={event.id} className="relative pl-14">
                  <div className="absolute left-[18px] top-2 h-4 w-4 rounded-full border-2 border-primary bg-background shadow" />
                  <button
                    type="button"
                    onClick={() => openDrawer(event)}
                    className="w-full text-left rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                  <h3
                    className="text-lg font-semibold"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {event.title}
                  </h3>
                  {statusBadge && (
                    <div className="mt-2">
                      <Badge variant={statusBadge.variant}>
                        {statusBadge.label}
                      </Badge>
                    </div>
                  )}

                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                    {/* Creator */}
                    {event.createdBy && (
                      <div className="flex items-center gap-2">
                        <Avatar size="sm">
                          {event.createdBy.avatarUrl && (
                            <AvatarImage src={event.createdBy.avatarUrl} />
                          )}
                          <AvatarFallback>{creatorInitials}</AvatarFallback>
                        </Avatar>
                        <span>
                          Organizado por{" "}
                          <span className="font-medium text-foreground">
                            {event.createdBy.name}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Date & time */}
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      <span>
                        {dateLabel} &middot; {timeLabel}
                      </span>
                    </div>

                    {/* Location (text only) */}
                    {event.locationType && event.locationValue && (
                      <div className="flex items-center gap-1.5">
                        {event.locationType === "physical" ? (
                          <MapPin className="h-4 w-4 shrink-0" />
                        ) : (
                          <Video className="h-4 w-4 shrink-0" />
                        )}
                        <span className="truncate">{event.locationValue}</span>
                      </div>
                    )}

                    {/* Capacity */}
                    {event.maxCapacity !== null &&
                    event.maxCapacity !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>
                            {event.reservedCount}/{event.maxCapacity} vagas
                          </span>
                        </div>
                        {isFull && (
                          <Badge variant="destructive">Lotado</Badge>
                        )}
                      </div>
                    ) : null}
                  </div>
                  </button>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailDrawer
          open={drawerOpen}
          onOpenChange={handleDrawerClose}
          event={selectedEvent}
          clubId={clubId}
          isOrganizer={isOrganizer}
          canViewEventDetails={canViewEventDetails}
          mapApiKey={mapApiKey}
          isLoggedIn={isLoggedIn}
          stripeConnectActive={stripeConnectActive}
        />
      )}
    </section>
  );
}
