export default function GoogleMapsLocation() {
  return (
    <div className="w-full h-full mb-5 rounded-lg overflow-hidden border">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3287.270422553886!2d-58.501560123633155!3d-34.521376072984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcb12561ec4671%3A0xd3c48bc23c9a3d05!2sCarlos%20Villate%202516%2C%20B1636GPP%20Olivos%2C%20Provincia%20de%20Buenos%20Aires!5e0!3m2!1ses!2sar!4v1743089146168!5m2!1ses!2sar"
        className="w-full h-full border-0"
        allowFullScreen
        loading="lazy"
        title="Dónde nos encontramos"
        aria-label="Mapa de Google mostrando la ubicación de Carlos Villate 2516, Olivos, Provincia de Buenos Aires"
      />
    </div>
  );
}