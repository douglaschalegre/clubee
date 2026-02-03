import type { Metadata } from "next";

const APP_URL = process.env.APP_BASE_URL || "http://localhost:3000";

interface Club {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  organizer: {
    name: string;
  };
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  timezone: string;
  locationType: string;
  locationValue: string;
}

function truncateDescription(text: string | null, maxLength: number = 160): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

function formatEventDate(startsAt: Date, timezone: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: timezone,
  }).format(startsAt);
}

export function generateClubMetadata(club: Club): Metadata {
  const title = `${club.name} | Clubee`;
  const description = truncateDescription(
    club.description ||
      `Clube organizado por ${club.organizer.name}. Junte-se aos membros!`
  );
  const url = `${APP_URL}/clubs/${club.id}`;
  const images = club.imageUrl ? [{ url: club.imageUrl }] : [];

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: "Clubee",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}

export function generateEventMetadata(event: Event, club: Club): Metadata {
  const title = `${event.title} | ${club.name} | Clubee`;
  const formattedDate = formatEventDate(event.startsAt, event.timezone);
  const locationText =
    event.locationType === "remote"
      ? "Online"
      : event.locationValue;

  const description = truncateDescription(
    event.description ||
      `${formattedDate} • ${locationText}`
  );

  const url = `${APP_URL}/clubs/${club.id}?event=${event.id}`;
  const images = club.imageUrl ? [{ url: club.imageUrl }] : [];

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url,
      siteName: "Clubee",
      title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
