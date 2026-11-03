import { describe, it, expect } from "vitest";
import { roleLabel } from "@/lib/format/roles";

describe("roleLabel", () => {
  it("mapea 'admin' a 'Admin'", () => {
    expect(roleLabel("admin")).toBe("Admin");
  });

  it("mapea 'barber' a 'Barbero'", () => {
    expect(roleLabel("barber")).toBe("Barbero");
  });

  it("mantiene otro valor tal cual", () => {
    expect(roleLabel("recepcionista")).toBe("recepcionista");
  });

  it("retorna string vacío si role es undefined o vacío", () => {
    expect(roleLabel(undefined)).toBe("");
    expect(roleLabel("")).toBe("");
  });
});
