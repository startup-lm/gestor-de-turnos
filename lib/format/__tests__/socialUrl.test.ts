import { describe, it, expect } from "vitest";
import { buildSocialUrl } from "@/lib/format/socialUrl";

describe("buildSocialUrl", () => {
  it("construye url para instagram con usuario", () => {
    expect(buildSocialUrl("instagram", "hellfish")).toBe("https://www.instagram.com/hellfish");
  });

  it("construye url para instagram con @", () => {
    expect(buildSocialUrl("instagram", "@hellfish")).toBe("https://www.instagram.com/hellfish");
  });

  it("construye url para tiktok con usuario", () => {
    expect(buildSocialUrl("tiktok", "hellfish")).toBe("https://www.tiktok.com/@hellfish");
  });

  it("construye url para facebook con punto en usuario", () => {
    expect(buildSocialUrl("facebook", "hellfish.barber")).toBe("https://www.facebook.com/hellfish.barber");
  });

  it("construye url para instagram con punto en usuario", () => {
    expect(buildSocialUrl("instagram", "hellfish.barber")).toBe("https://www.instagram.com/hellfish.barber");
  });

  it("agrega https a dominio sin protocolo con path", () => {
    expect(buildSocialUrl("facebook", "facebook.com/hellfish")).toBe("https://facebook.com/hellfish");
  });

  it("mantiene url completa con https", () => {
    expect(buildSocialUrl("instagram", "https://instagram.com/x")).toBe("https://instagram.com/x");
  });

  it("devuelve null si value es vacío o solo espacios", () => {
    expect(buildSocialUrl("instagram", "  ")).toBeNull();
  });

  it("devuelve null si name es desconocido", () => {
    expect(buildSocialUrl("otra", "usuario")).toBeNull();
  });

  it("agrega https a dominio sin protocolo que empieza con www", () => {
    expect(buildSocialUrl("instagram", "www.instagram.com/x")).toBe("https://www.instagram.com/x");
  });
});
