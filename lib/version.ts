/**
 * Versión actual de Turnik.
 * Se sincroniza automáticamente con el campo "version" de package.json
 * a través de NEXT_PUBLIC_APP_VERSION en next.config.ts.
 */
export const APP_VERSION: string =
  process.env.NEXT_PUBLIC_APP_VERSION || "1.8.0";
