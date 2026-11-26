import { describe, it, expect } from "vitest";
import {
  canWriteBucket,
  isAllowedBucket,
  isAllowedImageType,
  isSafeObjectPath,
  validateImageFile,
} from "@/lib/storage/policy";

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

  describe("validateImageFile", () => {
    it("jpeg de 1 MB es válido (retorna null)", () => {
      expect(validateImageFile({ type: "image/jpeg", size: 1024 * 1024 })).toBeNull();
    });

    it("image/svg+xml devuelve mensaje de formato", () => {
      expect(validateImageFile({ type: "image/svg+xml", size: 1024 })).toBe(
        "Formato no permitido. Subí una imagen JPG, PNG, WEBP o GIF."
      );
    });

    it("png de exactamente 4 MB es válido (retorna null)", () => {
      expect(validateImageFile({ type: "image/png", size: 4 * 1024 * 1024 })).toBeNull();
    });

    it("png de 4 MB + 1 byte devuelve mensaje de tamaño", () => {
      expect(validateImageFile({ type: "image/png", size: 4 * 1024 * 1024 + 1 })).toBe(
        "La imagen pesa 4.0 MB y el máximo es 4 MB. Reducila o elegí otra."
      );
    });

    it("png de 5 MB contiene '5.0 MB' en el mensaje", () => {
      const msg = validateImageFile({ type: "image/png", size: 5 * 1024 * 1024 });
      expect(msg).toContain("5.0 MB");
    });
  });
});
