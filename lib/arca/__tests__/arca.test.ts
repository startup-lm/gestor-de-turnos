import { describe, it, expect, vi, beforeAll } from "vitest";
import forge from "node-forge";
import { buildTra, getAccessTicket, parseLoginResponse, signTra } from "@/lib/arca/wsaa";
import { buildCaeRequest, conceptFor, parseCaeResponse, parseLastAuthorized, type CaeRequest } from "@/lib/arca/wsfe";
import { resolveReceiverCondition } from "@/lib/arca/receiverConditions";
import { resolveEndpoints } from "@/lib/arca/endpoints";
import { ArcaError } from "@/lib/arca/soap";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

const NOW = new Date("2026-11-03T15:00:00Z"); // 12:00 en Argentina

/** Certificado autofirmado de prueba (1024 bits para que el test sea rápido) */
let certPem = "";
let keyPem = "";
beforeAll(() => {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date("2026-01-01");
  cert.validity.notAfter = new Date("2028-01-01");
  const attrs = [{ name: "commonName", value: "turnik-test" }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  certPem = forge.pki.certificateToPem(cert);
  keyPem = forge.pki.privateKeyToPem(keys.privateKey);
});

describe("WSAA", () => {
  it("el TRA pide wsfe con una ventana de ±10 minutos en hora argentina", () => {
    const tra = buildTra(NOW);
    expect(tra).toContain("<service>wsfe</service>");
    expect(tra).toContain("<generationTime>2026-11-03T11:50:00-03:00</generationTime>");
    expect(tra).toContain("<expirationTime>2026-11-03T12:10:00-03:00</expirationTime>");
  });

  it("firma el TRA como CMS con el contenido y el certificado incluidos", () => {
    const tra = buildTra(NOW);
    const cms = signTra(tra, certPem, keyPem);
    const der = forge.util.decode64(cms);
    const p7 = forge.pkcs7.messageFromAsn1(forge.asn1.fromDer(der)) as forge.pkcs7.PkcsSignedData;
    // WSAA exige el TRA dentro del CMS (no "detached"); verificado también con `openssl smime -verify`
    expect(der).toContain(tra);
    expect(p7.certificates[0].subject.getField("CN").value).toBe("turnik-test");
  });

  it("una clave inválida da un error claro", () => {
    expect(() => signTra("x", certPem, "no es una clave")).toThrow(ArcaError);
    expect(() => signTra("x", "no es un certificado", keyPem)).toThrow(/certificado/);
  });

  it("lee token, sign y vencimiento del ticket escapado", () => {
    const xml =
      "<soapenv:Envelope><soapenv:Body><loginCmsResponse><loginCmsReturn>" +
      "&lt;loginTicketResponse&gt;&lt;header&gt;&lt;expirationTime&gt;2026-11-04T00:00:00.000-03:00&lt;/expirationTime&gt;&lt;/header&gt;" +
      "&lt;credentials&gt;&lt;token&gt;TOK&lt;/token&gt;&lt;sign&gt;SIG&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;" +
      "</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>";
    expect(parseLoginResponse(xml)).toEqual({ token: "TOK", sign: "SIG", expiresAt: "2026-11-04T00:00:00.000-03:00" });
  });

  it("traduce el fault de ticket vigente", () => {
    const xml = "<soapenv:Fault><faultcode>ns1:coe.alreadyAuthenticated</faultcode><faultstring>El CEE ya posee un TA valido para el acceso al WSN solicitado</faultstring></soapenv:Fault>";
    expect(() => parseLoginResponse(xml)).toThrow(/sigue vigente/);
  });

  it("reusa el ticket guardado si le quedan más de 10 minutos", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const ticket = await getAccessTicket(
      { cert_pem: null, key_pem: null, wsaa_token: "T", wsaa_sign: "S", wsaa_expires_at: "2026-11-03T20:00:00-03:00" },
      "https://wsaa",
      NOW
    );
    expect(ticket.token).toBe("T");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});

describe("WSFE", () => {
  const auth = { token: "T&1", sign: "S", expiresAt: "", cuit: "20123456789" };
  const base: CaeRequest = {
    pointOfSale: 3,
    voucherType: 11,
    voucherNumber: 8,
    concept: 2,
    docType: 99,
    docNumber: "",
    receiverIvaCondition: 5,
    total: 12000,
    date: "20261103",
  };

  it("Factura C de servicios: total = neto, sin IVA, con fechas de servicio y condición del receptor", () => {
    const xml = buildCaeRequest(auth, base);
    expect(xml).toContain("<ar:Token>T&amp;1</ar:Token>");
    expect(xml).toContain("<ar:CbteTipo>11</ar:CbteTipo>");
    expect(xml).toContain("<ar:CbteDesde>8</ar:CbteDesde><ar:CbteHasta>8</ar:CbteHasta>");
    expect(xml).toContain("<ar:ImpTotal>12000.00</ar:ImpTotal>");
    expect(xml).toContain("<ar:ImpNeto>12000.00</ar:ImpNeto>");
    expect(xml).toContain("<ar:ImpIVA>0.00</ar:ImpIVA>");
    expect(xml).toContain("<ar:DocNro>0</ar:DocNro>");
    expect(xml).toContain("<ar:FchServDesde>20261103</ar:FchServDesde>");
    expect(xml).toContain("<ar:CondicionIVAReceptorId>5</ar:CondicionIVAReceptorId>");
    expect(xml).not.toContain("<ar:Iva>");
  });

  it("Factura C de productos: sin fechas de servicio", () => {
    const xml = buildCaeRequest(auth, { ...base, concept: 1, docType: 80, docNumber: "20-12345678-9", receiverIvaCondition: 6 });
    expect(xml).not.toContain("FchServDesde");
    expect(xml).toContain("<ar:DocNro>20123456789</ar:DocNro>");
    expect(xml).toContain("<ar:CondicionIVAReceptorId>6</ar:CondicionIVAReceptorId>");
  });

  it("turnos y manuales son servicios; ventas, productos", () => {
    expect(conceptFor("appointment")).toBe(2);
    expect(conceptFor("manual")).toBe(2);
    expect(conceptFor("sale")).toBe(1);
  });

  it("lee un comprobante aprobado", () => {
    const xml =
      "<FECAESolicitarResult><FeCabResp><Resultado>A</Resultado></FeCabResp><FeDetResp><FECAEDetResponse>" +
      "<Resultado>A</Resultado><CbteDesde>8</CbteDesde><CAE>76123456789012</CAE><CAEFchVto>20261113</CAEFchVto>" +
      "</FECAEDetResponse></FeDetResp></FECAESolicitarResult>";
    expect(parseCaeResponse(xml, 8)).toMatchObject({ approved: true, cae: "76123456789012", caeDueDate: "2026-11-13", voucherNumber: 8 });
  });

  it("lee un rechazo con observaciones y errores", () => {
    const xml =
      "<FECAESolicitarResult><FeCabResp><Resultado>R</Resultado></FeCabResp><FeDetResp><FECAEDetResponse>" +
      "<Resultado>R</Resultado><Observaciones><Obs><Code>10015</Code><Msg>DocNro inválido</Msg></Obs></Observaciones>" +
      "</FECAEDetResponse></FeDetResp><Errors><Err><Code>10016</Code><Msg>Número incorrecto</Msg></Err></Errors></FECAESolicitarResult>";
    const result = parseCaeResponse(xml, 8);
    expect(result.approved).toBe(false);
    expect(result.cae).toBeNull();
    expect(result.observations).toEqual([{ code: 10015, message: "DocNro inválido" }]);
    expect(result.errors).toEqual([{ code: 10016, message: "Número incorrecto" }]);
  });

  it("lee el último número autorizado, o el error de ARCA", () => {
    expect(parseLastAuthorized("<FECompUltimoAutorizadoResult><PtoVta>3</PtoVta><CbteTipo>11</CbteTipo><CbteNro>41</CbteNro></FECompUltimoAutorizadoResult>")).toBe(41);
    expect(() =>
      parseLastAuthorized("<FECompUltimoAutorizadoResult><Errors><Err><Code>600</Code><Msg>No autorizado</Msg></Err></Errors></FECompUltimoAutorizadoResult>")
    ).toThrow("No autorizado (600)");
  });
});

describe("Receptor y entorno", () => {
  it("DNI y consumidor final son siempre consumidor final; CUIT necesita una condición válida", () => {
    expect(resolveReceiverCondition(99, 1)).toBe(5);
    expect(resolveReceiverCondition(96)).toBe(5);
    expect(resolveReceiverCondition(80, 6)).toBe(6);
    expect(resolveReceiverCondition(80, 99)).toBeNull();
    expect(resolveReceiverCondition(86)).toBeNull();
  });

  it("usa las URLs oficiales del entorno salvo que se configure otra", () => {
    expect(resolveEndpoints({ environment: "homo" }).wsfe).toContain("wswhomo");
    expect(resolveEndpoints({ environment: "prod" }).wsaa).toBe("https://wsaa.afip.gov.ar/ws/services/LoginCms");
    expect(resolveEndpoints({ environment: "prod", wsfe_url: " https://proxy/wsfe " }).wsfe).toBe("https://proxy/wsfe");
  });
});
