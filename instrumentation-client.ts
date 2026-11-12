import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Ajuste de muestreo de transacciones para monitoreo de rendimiento
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
