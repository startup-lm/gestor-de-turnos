import { parsePhoneNumberFromString } from "libphonenumber-js";

export interface NormalizedPhone {
  e164: string;      // Canonical international format, e.g. "+5491123456789"
  national: string;  // Clean national digits without prefixes, e.g. "1123456789"
  formatted: string; // Beautiful display format, e.g. "+54 9 11 2345-6789"
  isValid: boolean;
  country: string;
}

/**
 * Normaliza cualquier número de teléfono según las reglas de telecomunicaciones de Argentina:
 * - Entradas comunes: 10 dígitos (ej. "1123456789", "11 2345 6789"), con 15 ("111523456789", "1523456789"),
 *   con 0 inicial ("01123456789", "011 15 2345 6789"), con +54 ("+541123456789"), o con +549 ("+5491123456789").
 * - Formato canónico para DB y WhatsApp: "+549" + 10 dígitos -> "+549XXXXXXXXXX".
 * - También soporta números internacionales (ej. Estados Unidos, España, etc.) usando libphonenumber-js.
 */
export function normalizePhone(input?: string | null, defaultCountry = "AR"): NormalizedPhone {
  if (!input) {
    return { e164: "", national: "", formatted: "", isValid: false, country: defaultCountry };
  }

  const raw = String(input).trim();
  if (!raw) {
    return { e164: "", national: "", formatted: "", isValid: false, country: defaultCountry };
  }

  // Si es un bloqueo del sistema de turnos
  if (raw === "0000000000") {
    return { e164: "0000000000", national: "0000000000", formatted: "Bloqueo", isValid: true, country: "AR" };
  }

  const digits = raw.replace(/\D/g, "");
  const isAR = raw.startsWith("+54") || raw.startsWith("54") || defaultCountry === "AR";

  if (isAR) {
    let clean = digits;

    // Quitar prefijo de país 54 si existe
    if (clean.startsWith("54")) {
      clean = clean.slice(2);
    }
    // Quitar prefijo móvil internacional 9 si ya fue antepuesto
    if (clean.startsWith("9")) {
      clean = clean.slice(1);
    }
    // Quitar prefijo de discado interurbano 0 si está presente (ej. 011 -> 11, 0351 -> 351)
    if (clean.startsWith("0")) {
      clean = clean.slice(1);
    }

    // Manejo de prefijo móvil local 15:
    // Caso 1: AMBA 11 con 15 (11 15 xxxx-xxxx -> 11 dígitos total empezando con 1115)
    if (clean.startsWith("1115") && clean.length === 11) {
      clean = "11" + clean.slice(4);
    }
    // Caso 2: 15 ingresado sin código de área (10 dígitos empezando con 15 -> asume AMBA 11)
    else if (clean.startsWith("15") && clean.length === 10) {
      clean = "11" + clean.slice(2);
    }
    // Caso 3: Códigos de área comunes de 3 dígitos con 15 (ej. 351 15 xxx-xxxx)
    else {
      const commonAreaCodes = ["221", "223", "261", "264", "299", "341", "342", "351", "381", "387"];
      for (const area of commonAreaCodes) {
        if (clean.startsWith(area + "15") && clean.length === 12) {
          clean = area + clean.slice(area.length + 2);
          break;
        }
      }
    }

    // En Argentina, todos los números de celular son de exactamente 10 dígitos (código de área + abonado)
    if (clean.length === 10) {
      const area = clean.startsWith("11") ? clean.slice(0, 2) : clean.slice(0, 3);
      const rest = clean.slice(area.length);
      const splitRest = rest.length === 8 
        ? `${rest.slice(0, 4)}-${rest.slice(4)}` 
        : `${rest.slice(0, 3)}-${rest.slice(3)}`;

      return {
        e164: `+549${clean}`,
        national: clean,
        formatted: `+54 9 ${area} ${splitRest}`,
        isValid: true,
        country: "AR",
      };
    }
  }

  // Fallback con libphonenumber-js para números de otros países o formatos estándar
  try {
    const parsed = parsePhoneNumberFromString(raw, defaultCountry as any);
    if (parsed && parsed.isValid()) {
      if (parsed.country === "AR") {
        let nat: string = String(parsed.nationalNumber);
        if (nat.startsWith("9") && nat.length === 11) {
          nat = nat.slice(1);
        }
        return {
          e164: `+549${nat}`,
          national: nat,
          formatted: `+54 9 ${nat.slice(0, 2)} ${nat.slice(2, 6)}-${nat.slice(6)}`,
          isValid: true,
          country: "AR",
        };
      }

      return {
        e164: parsed.number,
        national: parsed.nationalNumber,
        formatted: parsed.formatInternational(),
        isValid: true,
        country: parsed.country || defaultCountry,
      };
    }
  } catch {
    // ignorar y retornar inválido
  }

  return {
    e164: raw,
    national: digits,
    formatted: raw,
    isValid: false,
    country: defaultCountry,
  };
}

/**
 * Compara dos números de teléfono de forma flexible para verificar si corresponden al mismo usuario.
 * Ignora diferencias en prefijos (+54, +549, 0, 15), espacios, guiones o paréntesis.
 */
export function arePhonesEqual(phoneA?: string | null, phoneB?: string | null): boolean {
  if (!phoneA || !phoneB) return false;

  const normA = normalizePhone(phoneA);
  const normB = normalizePhone(phoneB);

  if (normA.isValid && normB.isValid) {
    if (normA.country === "AR" && normB.country === "AR") {
      return normA.national === normB.national;
    }
    return normA.e164 === normB.e164;
  }

  // Si alguno no fue completamente validado, comparar los dígitos finales limpios (mínimo 8 dígitos)
  const digitsA = phoneA.replace(/\D/g, "");
  const digitsB = phoneB.replace(/\D/g, "");

  if (digitsA.length >= 8 && digitsB.length >= 8) {
    return digitsA.endsWith(digitsB.slice(-8)) || digitsB.endsWith(digitsA.slice(-8));
  }

  return digitsA === digitsB;
}

/**
 * Formatea un teléfono para su visualización elegante en tablas, modales o detalles.
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return "-";
  if (phone === "0000000000") return "Bloqueo";
  const normalized = normalizePhone(phone);
  return normalized.isValid ? normalized.formatted : phone;
}
