import { describe, it, expect } from "vitest";
import { buildCspReportOnly } from "@/lib/security/csp";

describe("buildCspReportOnly", () => {
  const validSupabaseUrl = "https://xyzcompany.supabase.co";
  const validSentryDsn = "https://publickey123@o12345.ingest.sentry.io/4507123456789012";

  it("genera la política completa con Supabase y Sentry DSN válidos", () => {
    const csp = buildCspReportOnly({
      supabaseUrl: validSupabaseUrl,
      sentryDsn: validSentryDsn,
    });

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: blob: https://xyzcompany.supabase.co https://*.googleusercontent.com");
    expect(csp).toContain("font-src 'self' data:");
    expect(csp).toContain("connect-src 'self' https://xyzcompany.supabase.co wss://xyzcompany.supabase.co https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io");
    expect(csp).toContain("frame-src https://www.google.com https://maps.google.com");
    expect(csp).toContain("worker-src 'self' blob:");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("report-uri https://o12345.ingest.sentry.io/api/4507123456789012/security/?sentry_key=publickey123");
    expect(csp).not.toContain("undefined");
  });

  it("omite el origen de Supabase cuando supabaseUrl no está definido o es vacío", () => {
    const csp = buildCspReportOnly({ sentryDsn: validSentryDsn });

    expect(csp).toContain("img-src 'self' data: blob: https://*.googleusercontent.com");
    expect(csp).toContain("connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io");
    expect(csp).not.toContain("supabase.co");
    expect(csp).not.toContain("wss://");
    expect(csp).not.toContain("undefined");

    const cspEmpty = buildCspReportOnly({ supabaseUrl: "" });
    expect(cspEmpty).not.toContain("undefined");
    expect(cspEmpty).not.toContain("wss://");
  });

  it("omite report-uri cuando sentryDsn no se pasa o está vacío", () => {
    const csp = buildCspReportOnly({ supabaseUrl: validSupabaseUrl });

    expect(csp).not.toContain("report-uri");
    expect(csp).not.toContain("undefined");

    const cspEmpty = buildCspReportOnly({});
    expect(cspEmpty).not.toContain("report-uri");
    expect(cspEmpty).not.toContain("undefined");
  });

  it("omite report-uri sin lanzar error cuando sentryDsn es inválido", () => {
    const invalidDsns = [
      "not-a-url",
      "https://",
      "https://host-only.com/123", // sin username/key
      "https://key@host-only.com", // sin project id
      "ftp://key@host.com/123",
    ];

    for (const dsn of invalidDsns) {
      expect(() => buildCspReportOnly({ sentryDsn: dsn })).not.toThrow();
      const csp = buildCspReportOnly({ sentryDsn: dsn });
      expect(csp).not.toContain("report-uri");
      expect(csp).not.toContain("undefined");
    }
  });

  it("omite supabase si la url es inválida sin lanzar error", () => {
    const csp = buildCspReportOnly({ supabaseUrl: "ftp://invalid-url" });
    expect(csp).toContain("img-src 'self' data: blob: https://*.googleusercontent.com");
    expect(csp).not.toContain("undefined");
  });

  it("funciona sin argumentos (objeto por defecto)", () => {
    const csp = buildCspReportOnly();
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain("undefined");
  });
});
