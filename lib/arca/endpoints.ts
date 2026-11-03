import type { ArcaEnvironment } from "@/lib/types/Arca";

/** URLs oficiales de ARCA; se usan cuando la configuración no trae una propia */
export const ARCA_ENDPOINTS: Record<ArcaEnvironment, { wsaa: string; wsfe: string }> = {
  homo: {
    wsaa: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
  },
  prod: {
    wsaa: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
  },
};

export function resolveEndpoints(config: {
  environment: string | null;
  wsaa_url?: string | null;
  wsfe_url?: string | null;
}) {
  const env: ArcaEnvironment = config.environment === "prod" ? "prod" : "homo";
  return {
    wsaa: config.wsaa_url?.trim() || ARCA_ENDPOINTS[env].wsaa,
    wsfe: config.wsfe_url?.trim() || ARCA_ENDPOINTS[env].wsfe,
  };
}
