import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Video, Users } from "lucide-react";

interface EventCardProps {
  title: string;
  startsAt: Date | string;
  timezone: string;
  description?: string | null;
  locationType?: "remote" | "physical" | null;
  locationValue?: string | null;
  rsvpCount?: number;
  showDetails?: boolean;
  summaryOnly?: boolean;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: Date | string) {
  return new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EventCard({
  title,
  startsAt,
  timezone,
  description,
  locationType,
  locationValue,
  rsvpCount,
  showDetails = false,
  summaryOnly = false,
}: EventCardProps) {
  const detailsVisible = showDetails && !summaryOnly;

  return (
    <article className="w-full rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(startsAt)} • {formatTime(startsAt)}
            </span>
            <Badge variant="outline" className="gap-1">
              {timezone}
            </Badge>
          </div>
        </div>
        {typeof rsvpCount === "number" && !summaryOnly && (
          <Badge variant="outline" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            {rsvpCount} {rsvpCount === 1 ? "confirmacao" : "confirmacoes"}
          </Badge>
        )}
      </div>

      {detailsVisible ? (
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          {description && <p className="leading-relaxed">{description}</p>}
          {locationType && locationValue && (
            <div className="flex items-center gap-2">
              {locationType === "remote" ? (
                <Video className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              <span>{locationValue}</span>
            </div>
          )}
        </div>
      ) : !summaryOnly ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Faça login e assine para ver os detalhes do evento.
        </p>
      ) : null}
    </article>
  );
}
