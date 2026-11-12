/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as lookupGET } from "@/app/api/clients/lookup/route";
import { POST as cancelPOST } from "@/app/api/turnos/cancelar/route";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/api/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

describe("Public Endpoints Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabaseAdmin.from).mockReset();
  });

  describe("GET /api/clients/lookup", () => {
    it("no devuelve 'name' completo del cliente, solo firstName y found: true", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: { name: "Martín Alejandro Palermo" },
          error: null,
        }),
      } as any);

      // Usar número argentino válido (10 dígitos nacionales)
      const res = await lookupGET(new Request("http://localhost:3000/api/clients/lookup?phone=1123456789"));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.found).toBe(true);
      expect(json.firstName).toBe("Martín");
      expect(json.name).toBeUndefined();
    });

    it("retorna found: false si no se encuentra el cliente", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      } as any);

      const res = await lookupGET(new Request("http://localhost:3000/api/clients/lookup?phone=1123456789"));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.found).toBe(false);
      expect(json.name).toBeUndefined();
      expect(json.firstName).toBeUndefined();
    });
  });

  describe("POST /api/turnos/cancelar", () => {
    const CANCEL_404_MESSAGE = "No encontramos un turno activo con ese número y teléfono";

    it("devuelve 404 con mensaje unificado si el id de turno no existe", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      } as any);

      const res = await cancelPOST(
        new Request("http://localhost:3000/api/turnos/cancelar", {
          method: "POST",
          body: JSON.stringify({ id: 9999, phone: "1123456789" }),
        })
      );
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe(CANCEL_404_MESSAGE);
    });

    it("devuelve 404 con mismo mensaje si el teléfono no coincide", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: {
            id: 10,
            phone: "+5491122334455",
            type: "appointment",
            arca_invoice_id: null,
            paid: false,
          },
          error: null,
        }),
      } as any);

      const res = await cancelPOST(
        new Request("http://localhost:3000/api/turnos/cancelar", {
          method: "POST",
          body: JSON.stringify({ id: 10, phone: "1199887766" }),
        })
      );
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe(CANCEL_404_MESSAGE);
    });

    it("devuelve 404 con mismo mensaje si corresponde a un bloqueo (type === 'block')", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: {
            id: 11,
            phone: "+5491122334455",
            type: "block",
            arca_invoice_id: null,
            paid: false,
          },
          error: null,
        }),
      } as any);

      const res = await cancelPOST(
        new Request("http://localhost:3000/api/turnos/cancelar", {
          method: "POST",
          body: JSON.stringify({ id: 11, phone: "1122334455" }),
        })
      );
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe(CANCEL_404_MESSAGE);
    });

    it("devuelve 404 con mismo mensaje si el teléfono es '0000000000'", async () => {
      vi.mocked(supabaseAdmin.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: {
            id: 12,
            phone: "0000000000",
            type: "appointment",
            arca_invoice_id: null,
            paid: false,
          },
          error: null,
        }),
      } as any);

      const res = await cancelPOST(
        new Request("http://localhost:3000/api/turnos/cancelar", {
          method: "POST",
          body: JSON.stringify({ id: 12, phone: "0000000000" }),
        })
      );
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error).toBe(CANCEL_404_MESSAGE);
    });
  });
});
