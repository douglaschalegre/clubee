"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EventDeleteButton } from "@/components/event-delete-button";
import { EventForm } from "@/components/event-form";
import { EventMapPreview } from "@/components/event-map-preview";
import { EventRsvpButtons } from "@/components/event-rsvp-buttons";
import { CalendarDays, Clock, MapPin, Settings, Users, Video } from "lucide-react";

type EventCreator = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

export type DrawerEvent = {
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

interface EventDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: DrawerEvent;
  clubId: string;
  isOrganizer: boolean;
  canViewEventDetails: boolean;
  mapApiKey?: string | null;
  isLoggedIn: boolean;
}

export function EventDetailDrawer({
  open,
  onOpenChange,
  event,
  clubId,
  isOrganizer,
  canViewEventDetails,
  mapApiKey,
  isLoggedIn,
}: EventDetailDrawerProps) {
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rsvpCount, setRsvpCount] = useState(event.rsvpCount);
  const [currentRsvpStatus, setCurrentRsvpStatus] = useState(
    event.rsvpStatus ?? null
  );

  // Sync state when a different event is opened
  const [trackedEventId, setTrackedEventId] = useState(event.id);
  if (event.id !== trackedEventId) {
    setTrackedEventId(event.id);
    setRsvpCount(event.rsvpCount);
    setCurrentRsvpStatus(event.rsvpStatus ?? null);
  }

  const startDate = new Date(event.startsAt);

  const shortDate = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "short",
    timeZone: event.timezone,
  }).format(startDate);

  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: event.timezone,
  }).format(startDate);

  const timeLabel = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone,
  }).format(startDate);

  const gmtOffset = (() => {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: event.timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(startDate);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? "";
  })();

  function handleStatusChange(status: "going" | "not_going") {
    const wasGoing = currentRsvpStatus === "going";
    const nowGoing = status === "going";

    setCurrentRsvpStatus(status);

    if (nowGoing && !wasGoing) {
      setRsvpCount((c) => c + 1);
    } else if (!nowGoing && wasGoing) {
      setRsvpCount((c) => Math.max(0, c - 1));
    }
  }

  function handleDeleted() {
    onOpenChange(false);
    router.refresh();
  }

  function handleEdited() {
    setEditDialogOpen(false);
    onOpenChange(false);
    router.refresh();
  }

  const creatorInitials = event.createdBy?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-lg overflow-y-auto px-6 pb-8">
          <DrawerHeader className="px-0 pt-4">
            <div className="flex items-start justify-between gap-3">
              <DrawerTitle
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {event.title}
              </DrawerTitle>
              {isOrganizer && (
                <div className="flex items-center gap-1 shrink-0">
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Editar evento"
                      >
                        <Settings className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Editar evento</DialogTitle>
                        <DialogDescription>
                          Atualize os detalhes do evento.
                        </DialogDescription>
                      </DialogHeader>
                      <EventForm
                        clubId={clubId}
                        eventId={event.id}
                        mode="edit"
                        initialData={{
                          title: event.title,
                          description: event.description,
                          startsAt: new Date(event.startsAt).toISOString(),
                          timezone: event.timezone,
                          locationType: event.locationType ?? undefined,
                          locationValue: event.locationValue ?? undefined,
                        }}
                        onSaved={handleEdited}
                      />
                    </DialogContent>
                  </Dialog>
                  <EventDeleteButton
                    clubId={clubId}
                    eventId={event.id}
                    eventTitle={event.title}
                    onDeleted={handleDeleted}
                  />
                </div>
              )}
            </div>
            <DrawerDescription className="sr-only">
              Detalhes do evento {event.title}
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-5">
            {/* Metadata row */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              {/* Left: date · time */}
              <span className="inline-flex items-center gap-1 capitalize">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                {shortDate} &middot; {timeLabel}
                <span className="text-muted-foreground/50 normal-case">
                  {gmtOffset}
                </span>
              </span>

              {/* Right: count · creator */}
              <span className="inline-flex items-center gap-1.5 text-muted-foreground/60">
                <Users className="h-3.5 w-3.5 shrink-0" />
                {rsvpCount}
                {event.createdBy && (
                  <>
                    <span className="text-border">·</span>
                    <span>
                      por{" "}
                      <span className="font-medium text-muted-foreground">
                        {event.createdBy.name}
                      </span>
                    </span>
                    <Avatar size="sm">
                      {event.createdBy.avatarUrl && (
                        <AvatarImage src={event.createdBy.avatarUrl} />
                      )}
                      <AvatarFallback>{creatorInitials}</AvatarFallback>
                    </Avatar>
                  </>
                )}
              </span>
            </div>

            {/* RSVP buttons */}
            {canViewEventDetails && !isOrganizer && (
              <EventRsvpButtons
                clubId={clubId}
                eventId={event.id}
                initialStatus={event.rsvpStatus ?? null}
                onStatusChange={handleStatusChange}
              />
            )}

            {/* Description */}
            {canViewEventDetails ? (
              <>
                {event.description && (
                  <div className="space-y-2 pt-2">
                    <h4
                      className="text-sm font-semibold border-b border-border/60 pb-2"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Sobre o evento
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {event.description}
                    </p>
                  </div>
                )}

                {/* Location */}
                {event.locationType && event.locationValue && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      {event.locationType === "physical" ? (
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <Video className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span>{event.locationValue}</span>
                    </div>
                    {event.locationType === "physical" && (
                      <EventMapPreview
                        apiKey={mapApiKey}
                        address={event.locationValue}
                      />
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isLoggedIn
                  ? "Assine o clube para ver os detalhes do evento."
                  : "Faça login e assine para ver os detalhes do evento."}
              </p>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
