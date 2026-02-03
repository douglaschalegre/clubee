"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { CalendarDays, MapPin, Plus, Video } from "lucide-react";

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
  rsvpCount: number;
  rsvpStatus?: "going" | "not_going" | null;
  createdBy?: EventCreator | null;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DrawerEvent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
              const creatorInitials = event.createdBy?.name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

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
          onOpenChange={setDrawerOpen}
          event={selectedEvent}
          clubId={clubId}
          isOrganizer={isOrganizer}
          canViewEventDetails={canViewEventDetails}
          mapApiKey={mapApiKey}
          isLoggedIn={isLoggedIn}
        />
      )}
    </section>
  );
}
