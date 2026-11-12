import https from "node:https";

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

/** El servidor de producción de WSFE usa una clave DH chica que OpenSSL 3 rechaza por defecto.
 *  Bajar el nivel de seguridad solo para ARCA; el certificado se sigue validando. */
const arcaAgent = new https.Agent({ ciphers: "DEFAULT@SECLEVEL=1", keepAlive: false });

export function postXml(
  url: string,
  body: string,
  headers: Record<string, string>,
  timeoutMs: number
): Promise<{ status: number; text: string }> {
  if (!url.startsWith("https://")) {
    return Promise.reject(
      new ArcaError("La dirección de ARCA tiene que empezar con https://", "service")
    );
  }

  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        agent: arcaAgent,
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          resolve({ status: res.statusCode ?? 200, text });
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("timeout"));
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.write(body);
    req.end();
  });
}

const TIMEOUT_MS = 20_000;

/** POST SOAP 1.1; devuelve el XML de respuesta (también los faults, que vienen con 500) */
export async function soapRequest(url: string, body: string, soapAction = ""): Promise<string> {
  let res: { status: number; text: string };
  try {
    res = await postXml(
      url,
      body,
      { "Content-Type": "text/xml; charset=utf-8", SOAPAction: `"${soapAction}"` },
      TIMEOUT_MS
    );
  } catch (err) {
    if (err instanceof ArcaError) throw err;
    throw new ArcaError("ARCA no respondió. Revisá en Facturas antes de reintentar", "network");
  }
  const { status, text } = res;
  if ((status < 200 || status >= 300) && !text.includes("Fault")) {
    throw new ArcaError(`ARCA respondió con un error (${status})`, "network");
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
