import { describe, it, expect, beforeEach } from "vitest";
import { useToastStore, toast } from "@/lib/store/useToastStore";

describe("useToastStore y toast helpers", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("debe agregar un toast con mensaje y tipo por defecto success", () => {
    toast.success("Turno guardado con éxito");

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe("Turno guardado con éxito");
    expect(toasts[0].type).toBe("success");
    expect(toasts[0].id).toBeDefined();
  });

  it("debe agregar un toast de error e info", () => {
    toast.error("Error al conectar con el servidor");
    toast.info("Información importante");

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(2);
    expect(toasts[0].type).toBe("error");
    expect(toasts[1].type).toBe("info");
  });

  it("debe eliminar un toast por su ID", () => {
    toast.success("Mensaje temporal");
    const id = useToastStore.getState().toasts[0].id;

    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
