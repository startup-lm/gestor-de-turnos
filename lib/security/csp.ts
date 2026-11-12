export interface CspReportOnlyOptions {
  supabaseUrl?: string;
  sentryDsn?: string;
}

function parseSupabaseOrigins(supabaseUrl?: string): { origin?: string; wssOrigin?: string } {
  if (!supabaseUrl) return {};
  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return {};
    const origin = url.origin;
    const wssOrigin = origin.replace(/^http/, "ws");
    return { origin, wssOrigin };
  } catch {
    return {};
  }
}

function parseSentryReportUri(sentryDsn?: string): string | null {
  if (!sentryDsn) return null;
  try {
    const url = new URL(sentryDsn);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const key = url.username;
    const host = url.host;
    const projectId = url.pathname.replace(/^\/+/, "").split("/")[0];
    if (!key || !host || !projectId) return null;
    return `https://${host}/api/${projectId}/security/?sentry_key=${key}`;
  } catch {
    return null;
  }
}

export function buildCspReportOnly({
  supabaseUrl,
  sentryDsn,
}: CspReportOnlyOptions = {}): string {
  const { origin: sbOrigin, wssOrigin: sbWssOrigin } = parseSupabaseOrigins(supabaseUrl);

  const imgSrcParts = ["'self'", "data:", "blob:"];
  if (sbOrigin) {
    imgSrcParts.push(sbOrigin);
  }
  imgSrcParts.push("https://*.googleusercontent.com");

  const connectSrcParts = ["'self'"];
  if (sbOrigin) {
    connectSrcParts.push(sbOrigin);
  }
  if (sbWssOrigin) {
    connectSrcParts.push(sbWssOrigin);
  }
  connectSrcParts.push(
    "https://*.sentry.io",
    "https://*.ingest.sentry.io",
    "https://*.ingest.us.sentry.io"
  );

  const directives: string[] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSrcParts.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSrcParts.join(" ")}`,
    "frame-src https://www.google.com https://maps.google.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];

  const reportUri = parseSentryReportUri(sentryDsn);
  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join("; ");
}
