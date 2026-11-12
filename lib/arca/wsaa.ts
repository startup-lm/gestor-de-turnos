import forge from "node-forge";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { ArcaError, decodeXml, soapFault, soapRequest, xmlTag } from "@/lib/arca/soap";
import { decryptSecret, encryptSecret, isEncrypted } from "@/lib/arca/secretBox";
import type { WsfeAuth } from "@/lib/arca/wsfe";

export type AccessTicket = { token: string; sign: string; expiresAt: string };

export type WsaaConfig = {
  cert_pem: string | null;
  key_pem: string | null;
  key_passphrase?: string | null;
  wsaa_token?: string | null;
  wsaa_sign?: string | null;
  wsaa_expires_at?: string | null;
};

const SERVICE = "wsfe";
/** Margen para no usar un ticket a punto de vencer */
const REUSE_MARGIN_MS = 10 * 60 * 1000;

/** "2026-11-03T10:00:00-03:00": WSAA pide la hora con zona */
function argentinaIso(date: Date): string {
  return new Date(date.getTime() - 3 * 3600 * 1000).toISOString().slice(0, 19) + "-03:00";
}

/** Pedido de acceso (TRA). Ventana de ±10 minutos para tolerar diferencias de reloj */
export function buildTra(now: Date = new Date(), service = SERVICE): string {
  const from = new Date(now.getTime() - 10 * 60 * 1000);
  const to = new Date(now.getTime() + 10 * 60 * 1000);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<loginTicketRequest version="1.0">',
    "<header>",
    `<uniqueId>${Math.floor(now.getTime() / 1000)}</uniqueId>`,
    `<generationTime>${argentinaIso(from)}</generationTime>`,
    `<expirationTime>${argentinaIso(to)}</expirationTime>`,
    "</header>",
    `<service>${service}</service>`,
    "</loginTicketRequest>",
  ].join("");
}

function readPrivateKey(keyPem: string, passphrase?: string | null) {
  try {
    const key = passphrase
      ? forge.pki.decryptRsaPrivateKey(keyPem, passphrase)
      : forge.pki.privateKeyFromPem(keyPem);
    if (key) return key;
  } catch {
    // cae al error de abajo
  }
  throw new ArcaError("No se pudo leer la clave privada. Revisá la clave y su contraseña", "auth");
}

/** Firma el TRA como CMS (PKCS#7) con el contenido incluido, en base64 */
export function signTra(tra: string, certPem: string, keyPem: string, passphrase?: string | null): string {
  let certificate: forge.pki.Certificate;
  try {
    certificate = forge.pki.certificateFromPem(certPem);
  } catch {
    throw new ArcaError("No se pudo leer el certificado. Revisá que sea el .crt que te dio ARCA", "auth");
  }
  const key = readPrivateKey(keyPem, passphrase);

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(tra, "utf8");
  p7.addCertificate(certificate);
  p7.addSigner({
    key,
    certificate,
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date() as unknown as string },
    ],
  });
  p7.sign();
  return forge.util.encode64(forge.asn1.toDer(p7.toAsn1()).getBytes());
}

export function buildLoginEnvelope(cms: string): string {
  return (
    '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ' +
    'xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">' +
    "<soapenv:Header/><soapenv:Body><wsaa:loginCms>" +
    `<wsaa:in0>${cms}</wsaa:in0>` +
    "</wsaa:loginCms></soapenv:Body></soapenv:Envelope>"
  );
}

/** Lee el ticket de la respuesta de loginCms (el XML del ticket viene escapado) */
export function parseLoginResponse(xml: string): AccessTicket {
  const fault = soapFault(xml);
  if (fault) {
    const faultXml = xmlTag(xml, "Fault") ?? "";
    const combined = `${fault} ${faultXml}`.toLowerCase();
    if (/ya posee un TA valido/i.test(fault) || combined.includes("ya posee un ta valido")) {
      throw new ArcaError(
        "ARCA ya entregó un acceso que sigue vigente y no se guardó. Esperá unos minutos y probá de nuevo",
        "auth"
      );
    }
    if (combined.includes("cms.cert.untrusted") || combined.includes("cms.bad")) {
      throw new ArcaError(
        "ARCA no reconoce el certificado. Revisá que sea del mismo entorno (homologación o producción) que elegiste",
        "auth"
      );
    }
    if (combined.includes("coe.notauthorized") || combined.includes("notauthorized")) {
      throw new ArcaError(
        "El certificado no tiene autorizado el servicio de factura electrónica (wsfe). Asocialo en el portal de ARCA",
        "auth"
      );
    }
    if (combined.includes("cms.cert.expired") || combined.includes("expired")) {
      throw new ArcaError(
        "El certificado de ARCA está vencido. Generá uno nuevo",
        "auth"
      );
    }
    throw new ArcaError(`ARCA rechazó el certificado: ${fault}`, "auth");
  }
  const ret = xmlTag(xml, "loginCmsReturn");
  const ticket = ret ? decodeXml(ret) : "";
  const token = xmlTag(ticket, "token");
  const sign = xmlTag(ticket, "sign");
  const expiresAt = xmlTag(ticket, "expirationTime");
  if (!token || !sign || !expiresAt) throw new ArcaError("Respuesta de ARCA inesperada al iniciar sesión", "auth");
  return { token, sign, expiresAt };
}

/** Vencimiento del certificado digital (null si no se puede leer) */
export function certificateExpiry(certPem: string): Date | null {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    return cert?.validity?.notAfter ?? null;
  } catch {
    return null;
  }
}

/** Ticket de acceso a WSFE: reusa el guardado mientras siga vigente; si no, pide uno y lo guarda */
export async function getAccessTicket(config: WsaaConfig, wsaaUrl: string, now: Date = new Date()): Promise<AccessTicket> {
  if (config.wsaa_token && config.wsaa_sign && config.wsaa_expires_at) {
    const expires = new Date(config.wsaa_expires_at).getTime();
    if (expires - now.getTime() > REUSE_MARGIN_MS) {
      return { token: config.wsaa_token, sign: config.wsaa_sign, expiresAt: config.wsaa_expires_at };
    }
  }
  if (!config.cert_pem || !config.key_pem) {
    throw new ArcaError("Falta cargar el certificado y la clave de ARCA", "auth");
  }

  const keyPem = decryptSecret(config.key_pem);
  const keyPassphrase = config.key_passphrase ? decryptSecret(config.key_passphrase) : config.key_passphrase;

  const cms = signTra(buildTra(now), config.cert_pem, keyPem, keyPassphrase);

  if (process.env.ARCA_ENCRYPTION_KEY) {
    const keyIsPlain = config.key_pem && !isEncrypted(config.key_pem);
    const passIsPlain = config.key_passphrase && !isEncrypted(config.key_passphrase);

    if (keyIsPlain || passIsPlain) {
      const migrationUpdate: { key_pem?: string; key_passphrase?: string } = {};
      if (keyIsPlain && config.key_pem) {
        migrationUpdate.key_pem = encryptSecret(config.key_pem);
      }
      if (passIsPlain && config.key_passphrase) {
        migrationUpdate.key_passphrase = encryptSecret(config.key_passphrase);
      }

      try {
        const { error: migrationError } = await supabaseAdmin
          .from("arca_settings")
          .update(migrationUpdate)
          .eq("id", 1);
        if (migrationError) {
          console.error("[arca:wsaa] no se pudo migrar la clave cifrada", migrationError);
        } else {
          if (migrationUpdate.key_pem) config.key_pem = migrationUpdate.key_pem;
          if (migrationUpdate.key_passphrase) config.key_passphrase = migrationUpdate.key_passphrase;
        }
      } catch (migrationErr) {
        console.error("[arca:wsaa] error al migrar la clave cifrada", migrationErr);
      }
    }
  }
  let ticket: AccessTicket;
  try {
    ticket = parseLoginResponse(await soapRequest(wsaaUrl, buildLoginEnvelope(cms)));
  } catch (err) {
    if (err instanceof ArcaError && /ya posee un TA valido|sigue vigente/i.test(err.message)) {
      const { data: stored } = await supabaseAdmin
        .from("arca_settings")
        .select("wsaa_token, wsaa_sign, wsaa_expires_at")
        .eq("id", 1)
        .maybeSingle();

      if (stored?.wsaa_token && stored?.wsaa_sign && stored?.wsaa_expires_at) {
        const expires = new Date(stored.wsaa_expires_at).getTime();
        if (expires - now.getTime() > REUSE_MARGIN_MS) {
          return { token: stored.wsaa_token, sign: stored.wsaa_sign, expiresAt: stored.wsaa_expires_at };
        }
      }
    }
    throw err;
  }

  const { error } = await supabaseAdmin
    .from("arca_settings")
    .update({ wsaa_token: ticket.token, wsaa_sign: ticket.sign, wsaa_expires_at: ticket.expiresAt })
    .eq("id", 1);
  if (error) console.error("[arca:wsaa] no se pudo guardar el ticket", error);

  return ticket;
}

/**
 * Ejecuta una operación con WSFE usando el ticket de acceso.
 * Si WSFE rechaza la autenticación con código 600, limpia el ticket guardado,
 * solicita uno nuevo y reintenta la operación una sola vez.
 */
export async function withAccessTicket<T>(
  config: WsaaConfig & { cuit: string | null },
  wsaaUrl: string,
  run: (auth: WsfeAuth) => Promise<T>
): Promise<T> {
  const cuit = String(config.cuit ?? "").replace(/\D/g, "");
  let ticket = await getAccessTicket(config, wsaaUrl);
  let auth: WsfeAuth = { ...ticket, cuit };

  try {
    return await run(auth);
  } catch (err) {
    if (err instanceof ArcaError && err.codes.includes(600)) {
      await supabaseAdmin
        .from("arca_settings")
        .update({ wsaa_token: null, wsaa_sign: null, wsaa_expires_at: null })
        .eq("id", 1);

      const freshConfig: WsaaConfig & { cuit: string | null } = {
        ...config,
        wsaa_token: null,
        wsaa_sign: null,
        wsaa_expires_at: null,
      };
      ticket = await getAccessTicket(freshConfig, wsaaUrl);
      auth = { ...ticket, cuit };

      return await run(auth);
    }
    throw err;
  }
}
