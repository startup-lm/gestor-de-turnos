import { describe, it, expect } from "vitest";
import { canWriteBucket, isAllowedBucket, isAllowedImageType, isSafeObjectPath } from "@/lib/storage/policy";

describe("política de storage", () => {
  it("solo acepta buckets conocidos", () => {
    expect(isAllowedBucket("products")).toBe(true);
    expect(isAllowedBucket("otro-bucket")).toBe(false);
    expect(isAllowedBucket(undefined)).toBe(false);
  });

  it("un barbero solo puede modificar fotos de barberos; el admin, todo", () => {
    expect(canWriteBucket("barbers", "barber")).toBe(true);
    expect(canWriteBucket("branding", "barber")).toBe(false);
    expect(canWriteBucket("branding", "admin")).toBe(true);
  });

  it("solo acepta imágenes", () => {
    expect(isAllowedImageType("image/png")).toBe(true);
    expect(isAllowedImageType("image/svg+xml")).toBe(false);
    expect(isAllowedImageType("application/pdf")).toBe(false);
  });

  it("rechaza rutas con directorios o traversal", () => {
    expect(isSafeObjectPath("1730000000-ab12cd34.png")).toBe(true);
    expect(isSafeObjectPath("../secretos.png")).toBe(false);
    expect(isSafeObjectPath("carpeta/foto.png")).toBe(false);
    expect(isSafeObjectPath("")).toBe(false);
  });
});
