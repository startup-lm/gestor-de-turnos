import { todayInArgentina } from "@/lib/dates/argentina";
import { ArcaError, decodeXml, escapeXml, soapFault, soapRequest, xmlTag, xmlTags } from "@/lib/arca/soap";
import type { AccessTicket } from "@/lib/arca/wsaa";
import type { ArcaDocType, ArcaSourceType } from "@/lib/types/Arca";

/** Factura C: la que emiten monotributistas, sin IVA discriminado */
export const FACTURA_C = 11;
/** "El número o fecha del comprobante no se corresponde con el próximo a autorizar" */
export const ERR_WRONG_NUMBER = 10016;

const NS = "http://ar.gov.afip.dif.FEV1/";

export type WsfeAuth = AccessTicket & { cuit: string };

export type CaeRequest = {
  pointOfSale: number;
  voucherType: number;
  voucherNumber: number;
  concept: 1 | 2 | 3;
  docType: ArcaDocType;
  docNumber: string;
  receiverIvaCondition: number;
  total: number;
  date: string; // YYYYMMDD
};

export type ArcaMessage = { code: number; message: string };

export type CaeResult = {
  approved: boolean;
  cae: string | null;
  caeDueDate: string | null; // YYYY-MM-DD
  voucherNumber: number;
  errors: ArcaMessage[];
  observations: ArcaMessage[];
};

/** Turnos y cobros manuales son servicios (2); ventas de productos, 1 */
export function conceptFor(sourceType: ArcaSourceType): 1 | 2 {
  return sourceType === "sale" ? 1 : 2;
}

/** Fecha de hoy en Argentina como YYYYMMDD */
export function arcaDate(now: Date = new Date()): string {
  return todayInArgentina(now).replace(/-/g, "");
}

function amount(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

function envelope(method: string, inner: string): string {
  return (
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="${NS}">` +
    `<soapenv:Header/><soapenv:Body><ar:${method}>${inner}</ar:${method}></soapenv:Body></soapenv:Envelope>`
  );
}

function authXml(auth: WsfeAuth): string {
  return (
    "<ar:Auth>" +
    `<ar:Token>${escapeXml(auth.token)}</ar:Token>` +
    `<ar:Sign>${escapeXml(auth.sign)}</ar:Sign>` +
    `<ar:Cuit>${auth.cuit}</ar:Cuit>` +
    "</ar:Auth>"
  );
}

/** Cuerpo de FECAESolicitar para un solo comprobante C (el orden de las etiquetas lo fija el WSDL) */
export function buildCaeRequest(auth: WsfeAuth, req: CaeRequest): string {
  const total = amount(req.total);
  const docNumber = req.docType === 99 ? "0" : req.docNumber.replace(/\D/g, "");
  const serviceDates =
    req.concept === 1
      ? ""
      : `<ar:FchServDesde>${req.date}</ar:FchServDesde>` +
        `<ar:FchServHasta>${req.date}</ar:FchServHasta>` +
        `<ar:FchVtoPago>${req.date}</ar:FchVtoPago>`;

  return envelope(
    "FECAESolicitar",
    authXml(auth) +
      "<ar:FeCAEReq>" +
      "<ar:FeCabReq>" +
      "<ar:CantReg>1</ar:CantReg>" +
      `<ar:PtoVta>${req.pointOfSale}</ar:PtoVta>` +
      `<ar:CbteTipo>${req.voucherType}</ar:CbteTipo>` +
      "</ar:FeCabReq>" +
      "<ar:FeDetReq><ar:FECAEDetRequest>" +
      `<ar:Concepto>${req.concept}</ar:Concepto>` +
      `<ar:DocTipo>${req.docType}</ar:DocTipo>` +
      `<ar:DocNro>${docNumber}</ar:DocNro>` +
      `<ar:CbteDesde>${req.voucherNumber}</ar:CbteDesde>` +
      `<ar:CbteHasta>${req.voucherNumber}</ar:CbteHasta>` +
      `<ar:CbteFch>${req.date}</ar:CbteFch>` +
      `<ar:ImpTotal>${total}</ar:ImpTotal>` +
      "<ar:ImpTotConc>0.00</ar:ImpTotConc>" +
      `<ar:ImpNeto>${total}</ar:ImpNeto>` +
      "<ar:ImpOpEx>0.00</ar:ImpOpEx>" +
      "<ar:ImpTrib>0.00</ar:ImpTrib>" +
      "<ar:ImpIVA>0.00</ar:ImpIVA>" +
      serviceDates +
      "<ar:MonId>PES</ar:MonId>" +
      "<ar:MonCotiz>1</ar:MonCotiz>" +
      `<ar:CondicionIVAReceptorId>${req.receiverIvaCondition}</ar:CondicionIVAReceptorId>` +
      "</ar:FECAEDetRequest></ar:FeDetReq>" +
      "</ar:FeCAEReq>"
  );
}

function parseMessages(xml: string | null, item: string): ArcaMessage[] {
  if (!xml) return [];
  return xmlTags(xml, item).map((m) => ({
    code: Number(xmlTag(m, "Code") ?? 0),
    message: decodeXml(xmlTag(m, "Msg") ?? ""),
  }));
}

function assertNoFault(xml: string) {
  const fault = soapFault(xml);
  if (fault) throw new ArcaError(`ARCA rechazó el pedido: ${fault}`);
}

/** Errores generales de WSFE (token vencido, CUIT no autorizado, etc.) */
function serviceErrors(result: string): ArcaMessage[] {
  const errors = xmlTag(result, "Errors");
  return parseMessages(errors, "Err");
}

export function parseCaeResponse(xml: string, voucherNumber: number): CaeResult {
  assertNoFault(xml);
  const result = xmlTag(xml, "FECAESolicitarResult") ?? "";
  const detail = xmlTag(result, "FECAEDetResponse") ?? "";
  const resultCode = xmlTag(detail, "Resultado") ?? xmlTag(result, "Resultado");
  const cae = xmlTag(detail, "CAE");
  const due = xmlTag(detail, "CAEFchVto");
  const approved = resultCode === "A" && !!cae;

  return {
    approved,
    cae: approved ? cae : null,
    caeDueDate: approved && due && /^\d{8}$/.test(due) ? `${due.slice(0, 4)}-${due.slice(4, 6)}-${due.slice(6, 8)}` : null,
    voucherNumber: Number(xmlTag(detail, "CbteDesde") ?? voucherNumber),
    errors: serviceErrors(result),
    observations: parseMessages(xmlTag(detail, "Observaciones"), "Obs"),
  };
}

export function parseLastAuthorized(xml: string): number {
  assertNoFault(xml);
  const result = xmlTag(xml, "FECompUltimoAutorizadoResult") ?? "";
  const errors = serviceErrors(result);
  if (errors.length > 0) throw new ArcaError(formatArcaMessages(errors), "service", errors.map((e) => e.code));
  const number = Number(xmlTag(result, "CbteNro"));
  if (Number.isNaN(number)) throw new ArcaError("Respuesta de ARCA inesperada al consultar el último comprobante");
  return number;
}

export function formatArcaMessages(messages: ArcaMessage[]): string {
  return messages.map((m) => `${m.message} (${m.code})`).join(". ");
}

export async function lastAuthorized(wsfeUrl: string, auth: WsfeAuth, pointOfSale: number, voucherType = FACTURA_C) {
  const body = envelope(
    "FECompUltimoAutorizado",
    authXml(auth) + `<ar:PtoVta>${pointOfSale}</ar:PtoVta><ar:CbteTipo>${voucherType}</ar:CbteTipo>`
  );
  return parseLastAuthorized(await soapRequest(wsfeUrl, body, `${NS}FECompUltimoAutorizado`));
}

export async function requestCae(wsfeUrl: string, auth: WsfeAuth, req: CaeRequest): Promise<CaeResult> {
  const xml = await soapRequest(wsfeUrl, buildCaeRequest(auth, req), `${NS}FECAESolicitar`);
  return parseCaeResponse(xml, req.voucherNumber);
}

export type VoucherLookup =
  | { found: false }
  | {
      found: true;
      approved: boolean;
      cae: string | null;
      caeDueDate: string | null; // YYYY-MM-DD
      total: number;
      docType: number;
      docNumber: string;
      voucherNumber: number;
    };

export function buildConsultVoucher(
  auth: WsfeAuth,
  pointOfSale: number,
  voucherType: number,
  voucherNumber: number
): string {
  return envelope(
    "FECompConsultar",
    authXml(auth) +
      `<ar:FeCompConsReq><ar:CbteTipo>${voucherType}</ar:CbteTipo><ar:CbteNro>${voucherNumber}</ar:CbteNro><ar:PtoVta>${pointOfSale}</ar:PtoVta></ar:FeCompConsReq>`
  );
}

export function parseConsultVoucher(xml: string): VoucherLookup {
  assertNoFault(xml);
  const result = xmlTag(xml, "FECompConsultarResult") ?? "";
  const errors = serviceErrors(result);
  if (errors.some((e) => e.code === 602)) {
    return { found: false };
  }
  if (errors.length > 0) {
    throw new ArcaError(formatArcaMessages(errors), "service", errors.map((e) => e.code));
  }

  const resultGet = xmlTag(result, "ResultGet") ?? "";
  const resultCode = xmlTag(resultGet, "Resultado");
  const approved = resultCode === "A";
  const cae = xmlTag(resultGet, "CodAutorizacion") || null;
  const due = xmlTag(resultGet, "FchVto");
  const caeDueDate =
    due && /^\d{8}$/.test(due) ? `${due.slice(0, 4)}-${due.slice(4, 6)}-${due.slice(6, 8)}` : null;
  const total = Number(xmlTag(resultGet, "ImpTotal") ?? 0);
  const docType = Number(xmlTag(resultGet, "DocTipo") ?? 0);
  const docNumber = xmlTag(resultGet, "DocNro") ?? "";
  const voucherNumber = Number(xmlTag(resultGet, "CbteDesde") ?? xmlTag(resultGet, "CbteNro") ?? 0);

  return {
    found: true,
    approved,
    cae,
    caeDueDate,
    total,
    docType,
    docNumber,
    voucherNumber,
  };
}

export async function consultVoucher(
  wsfeUrl: string,
  auth: WsfeAuth,
  pointOfSale: number,
  voucherNumber: number,
  voucherType = FACTURA_C
): Promise<VoucherLookup> {
  const xml = await soapRequest(
    wsfeUrl,
    buildConsultVoucher(auth, pointOfSale, voucherType, voucherNumber),
    `${NS}FECompConsultar`
  );
  return parseConsultVoucher(xml);
}

export type PointOfSaleInfo = { number: number; emissionType: string; blocked: boolean; deregistered: boolean };

export function parsePointsOfSale(xml: string): PointOfSaleInfo[] | null {
  assertNoFault(xml);
  const result = xmlTag(xml, "FEParamGetPtosVentaResult") ?? "";
  const errors = serviceErrors(result);
  if (errors.some((e) => e.code === 602)) {
    return null;
  }
  if (errors.length > 0) {
    throw new ArcaError(formatArcaMessages(errors), "service", errors.map((e) => e.code));
  }

  const resultGet = xmlTag(result, "ResultGet");
  if (!resultGet) return [];
  const ptos = xmlTags(resultGet, "PtoVenta");
  return ptos.map((p) => {
    const number = Number(xmlTag(p, "Nro") ?? 0);
    const emissionType = decodeXml(xmlTag(p, "EmisionTipo") ?? "");
    const blocked = xmlTag(p, "Bloqueado") === "S";
    const fchBaja = xmlTag(p, "FchBaja");
    const deregistered = !!fchBaja && fchBaja.trim() !== "" && fchBaja.trim().toUpperCase() !== "NULL";
    return {
      number,
      emissionType,
      blocked,
      deregistered,
    };
  });
}

export async function pointsOfSale(wsfeUrl: string, auth: WsfeAuth): Promise<PointOfSaleInfo[] | null> {
  const xml = await soapRequest(
    wsfeUrl,
    envelope("FEParamGetPtosVenta", authXml(auth)),
    `${NS}FEParamGetPtosVenta`
  );
  return parsePointsOfSale(xml);
}

/** Estado de los servidores de ARCA (no pide autenticación) */
export async function dummy(wsfeUrl: string) {
  const xml = await soapRequest(wsfeUrl, envelope("FEDummy", ""), `${NS}FEDummy`);
  assertNoFault(xml);
  return {
    appServer: xmlTag(xml, "AppServer"),
    dbServer: xmlTag(xml, "DbServer"),
    authServer: xmlTag(xml, "AuthServer"),
  };
}
