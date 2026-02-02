interface EventMapPreviewProps {
  apiKey?: string | null;
  placeId?: string | null;
}

export function EventMapPreview({ apiKey, placeId }: EventMapPreviewProps) {
  if (!apiKey || !placeId) {
    return null;
  }

  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${placeId}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <iframe
        title="Mapa do evento"
        src={mapSrc}
        className="h-64 w-full"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
