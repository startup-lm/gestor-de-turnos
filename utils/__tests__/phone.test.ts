import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  arePhonesEqual,
  formatPhoneDisplay,
} from "@/utils/phone";

describe("normalizePhone", () => {
  it("debe retornar inválido para valores vacíos o nulos", () => {
    expect(normalizePhone(null).isValid).toBe(false);
    expect(normalizePhone("").isValid).toBe(false);
    expect(normalizePhone("   ").isValid).toBe(false);
  });

  it("debe aceptar y normalizar el número especial de bloqueo del sistema", () => {
    const result = normalizePhone("0000000000");

    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("0000000000");
    expect(result.formatted).toBe("Bloqueo");
  });

  it("debe normalizar número de 10 dígitos estándar a formato canónico (+549...)", () => {
    const result = normalizePhone("1123456789");

    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491123456789");
    expect(result.national).toBe("1123456789");
  });

  it("debe quitar el prefijo interurbano '0' inicial de Argentina", () => {
    const result = normalizePhone("01123456789");

    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491123456789");
    expect(result.national).toBe("1123456789");
  });

  it("debe procesar números de AMBA con prefijo móvil '15' (11 15 xxxx-xxxx)", () => {
    const result = normalizePhone("111523456789");

    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491123456789");
  });

  it("debe manejar números con espacios, guiones y paréntesis", () => {
    const result = normalizePhone("(011) 15-2345-6789");

    expect(result.isValid).toBe(true);
    expect(result.e164).toBe("+5491123456789");
  });

  it("debe rechazar números con longitud insuficiente o inválidos", () => {
    expect(normalizePhone("123").isValid).toBe(false);
    expect(normalizePhone("abcdefghij").isValid).toBe(false);
  });
});

describe("arePhonesEqual", () => {
  it("debe considerar iguales números con diferente formato visual o prefijo local", () => {
    expect(arePhonesEqual("1123456789", "+5491123456789")).toBe(true);
    expect(arePhonesEqual("011-2345-6789", "11 15 2345 6789")).toBe(true);
  });

  it("debe considerar distintos dos números con diferente abonado", () => {
    expect(arePhonesEqual("1123456789", "1199999999")).toBe(false);
  });
});

describe("formatPhoneDisplay", () => {
  it("debe formatear teléfonos para visualización amigable", () => {
    const display = formatPhoneDisplay("1123456789");
    expect(display).toContain("11");
    expect(display).toContain("2345");
  });

  it("debe retornar 'Bloqueo' para 0000000000 y guion para vacíos", () => {
    expect(formatPhoneDisplay("0000000000")).toBe("Bloqueo");
    expect(formatPhoneDisplay(null)).toBe("-");
    expect(formatPhoneDisplay("")).toBe("-");
  });
});
