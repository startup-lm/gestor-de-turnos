import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit } from "@/lib/api/rateLimit";

describe("rateLimit (Sliding Window Algorithm)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("debe permitir solicitudes mientras estén por debajo del límite", () => {
    const ip = "192.168.1.1";
    const res1 = rateLimit(ip, 3, 60000);
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = rateLimit(ip, 3, 60000);
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = rateLimit(ip, 3, 60000);
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("debe bloquear la solicitud cuando se supera el límite", () => {
    const ip = "192.168.1.2";
    rateLimit(ip, 2, 60000);
    rateLimit(ip, 2, 60000);

    const blocked = rateLimit(ip, 2, 60000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("debe restablecer el cupo cuando expira la ventana de tiempo", () => {
    const ip = "192.168.1.3";
    rateLimit(ip, 1, 60000);

    // Se encuentra bloqueado dentro de la misma ventana
    expect(rateLimit(ip, 1, 60000).success).toBe(false);

    // Avanzar el reloj 61 segundos
    vi.advanceTimersByTime(61000);

    // Debe permitirse nuevamente
    const retry = rateLimit(ip, 1, 60000);
    expect(retry.success).toBe(true);
    expect(retry.remaining).toBe(0);
  });
});
