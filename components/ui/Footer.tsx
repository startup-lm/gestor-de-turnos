export default function Footer() {
  return (
    <footer className="bg-[var(--background)] text-[var(--secondary)] py-8 px-4">
      <div className="mt-8 text-center text-xs">
        © {new Date().getFullYear()} Desarrollado por LM². Todos los derechos reservados.
      </div>
    </footer>
  );
}
