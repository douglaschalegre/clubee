interface EventMapPreviewProps {
  apiKey?: string | null;
  address?: string | null;
}

export function EventMapPreview({ apiKey, address }: EventMapPreviewProps) {
  if (!apiKey || !address) {
    return null;
  }

  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <iframe
        title="Mapa do evento"
        src={mapSrc}
        className="h-40 w-full"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
