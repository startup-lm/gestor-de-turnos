interface Props {
  address?: string;
  className?: string;
}

export default function GoogleMapsLocation({ address, className }: Readonly<Props>) {
  const query = address ? address.trim() : "Obelisco, Buenos Aires, Argentina";
  const iframeUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={className ?? "w-full h-full rounded-lg overflow-hidden border border-[var(--foreground)]/10 shadow-inner"}>
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        title="Dónde nos encontramos"
        aria-label={`Mapa de Google mostrando la ubicación de ${query}`}
      />
    </div>
  );
}