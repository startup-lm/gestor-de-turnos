/** Error de ARCA con un mensaje que se le puede mostrar al usuario */
export class ArcaError extends Error {
  constructor(
    message: string,
    public readonly kind: "network" | "auth" | "service" = "service",
    public readonly codes: number[] = []
  ) {
    super(message);
    this.name = "ArcaError";
  }
}

const TIMEOUT_MS = 20_000;

/** POST SOAP 1.1; devuelve el XML de respuesta (también los faults, que vienen con 500) */
export async function soapRequest(url: string, body: string, soapAction = ""): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `"${soapAction}"` },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new ArcaError("ARCA no respondió. Revisá en Facturas antes de reintentar", "network");
  }
  const text = await res.text();
  if (!res.ok && !text.includes("Fault")) {
    throw new ArcaError(`ARCA respondió con un error (${res.status})`, "network");
  }
  return text;
}

const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&amp;": "&" };

export function decodeXml(value: string): string {
  return value.replace(/&(lt|gt|quot|apos|amp);/g, (m) => ENTITIES[m]);
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Contenido de la primera etiqueta `name` (con o sin prefijo de namespace) */
export function xmlTag(xml: string, name: string): string | null {
  const match = xml.match(new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`));
  return match ? match[1].trim() : null;
}

/** Contenido de todas las etiquetas `name` */
export function xmlTags(xml: string, name: string): string[] {
  const re = new RegExp(`<(?:[\\w-]+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w-]+:)?${name}>`, "g");
  return Array.from(xml.matchAll(re), (m) => m[1].trim());
}

/** Mensaje de un SOAP fault, si la respuesta es uno */
export function soapFault(xml: string): string | null {
  const fault = xmlTag(xml, "Fault");
  return fault ? decodeXml(xmlTag(fault, "faultstring") ?? "Error de ARCA") : null;
}
