import { describe, it, expect } from "vitest";
import { z } from "zod";
import { parseBody } from "../parseBody";

describe("parseBody helper", () => {
  const TestSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    age: z.number().int().positive("La edad debe ser mayor a cero"),
  });

  it("devuelve los datos parseados cuando el body es válido", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Carlos", age: 30 }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseBody(request, TestSchema);
    expect(result.error).toBeNull();
    expect(result.data).toEqual({ name: "Carlos", age: 30 });
  });

  it("devuelve 400 'Datos inválidos' cuando el JSON está roto", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "{ nombre roto: 123",
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseBody(request, TestSchema);
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(400);

    const body = await result.error?.json();
    expect(body).toEqual({ error: "Datos inválidos" });
  });

  it("devuelve 400 'Datos inválidos' cuando el body está vacío", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "   ",
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseBody(request, TestSchema);
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(400);

    const body = await result.error?.json();
    expect(body).toEqual({ error: "Datos inválidos" });
  });

  it("devuelve 400 con el mensaje del primer issue cuando Zod falla", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "", age: -5 }),
      headers: { "Content-Type": "application/json" },
    });

    const result = await parseBody(request, TestSchema);
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.status).toBe(400);

    const body = await result.error?.json();
    expect(body).toEqual({ error: "El nombre es obligatorio" });
  });
});
