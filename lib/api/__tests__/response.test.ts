import { describe, it, expect, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { dbErrorResponse, GENERIC_ERROR_MESSAGE } from "@/lib/api/response";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

describe("dbErrorResponse", () => {
  it("devuelve 500 con GENERIC_ERROR_MESSAGE y llama a captureException con tags de contexto", async () => {
    const error = new Error("x");
    const response = dbErrorResponse(error, "ctx");

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: GENERIC_ERROR_MESSAGE });
    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { context: "ctx" },
    });
  });
});
