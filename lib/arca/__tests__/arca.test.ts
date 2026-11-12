import { describe, it, expect, vi, beforeAll } from "vitest";
import https from "node:https";
import EventEmitter from "node:events";
import forge from "node-forge";
import {
  buildTra,
  certificateExpiry,
  getAccessTicket,
  parseLoginResponse,
  signTra,
  withAccessTicket,
} from "@/lib/arca/wsaa";
import {
  buildCaeRequest,
  buildConsultVoucher,
  conceptFor,
  parseCaeResponse,
  parseConsultVoucher,
  parseLastAuthorized,
  parsePointsOfSale,
  type CaeRequest,
} from "@/lib/arca/wsfe";
import { resolveReceiverCondition } from "@/lib/arca/receiverConditions";
import { resolveEndpoints, urlMatchesEnvironment } from "@/lib/arca/endpoints";
import { ArcaError } from "@/lib/arca/soap";
import { encryptSecret } from "@/lib/arca/secretBox";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

vi.mock("node:https", () => ({
  default: {
    Agent: vi.fn(),
    request: vi.fn(),
  },
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
function mockHttpsResponse(status: number, xml: string) {
  const mockReq: any = new EventEmitter();
  mockReq.setTimeout = vi.fn();
  mockReq.destroy = vi.fn();
  mockReq.write = vi.fn();
  mockReq.end = vi.fn();

  vi.mocked(https.request).mockImplementation((_url: any, _opts: any, callback: any) => {
    const mockRes: any = new EventEmitter();
    mockRes.statusCode = status;
    setTimeout(() => {
      callback(mockRes);
      mockRes.emit("data", Buffer.from(xml));
      mockRes.emit("end");
    }, 0);
    return mockReq;
  });
  return mockReq;
}

const NOW = new Date("2026-11-03T15:00:00Z"); // 12:00 en Argentina

/** Certificado autofirmado de prueba (1024 bits para que el test sea rápido) */
let certPem = "";
let keyPem = "";
beforeAll(() => {
  const keys = forge.pki.rsa.generateKeyPair(1024);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = "01";
  cert.validity.notBefore = new Date("2026-01-01T12:00:00Z");
  cert.validity.notAfter = new Date("2028-06-01T12:00:00Z");
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

  it("traduce faults de certificados y autorización con mensajes claros", () => {
    const untrustedXml =
      "<soapenv:Fault><faultcode>soap:Server</faultcode><faultstring>cms.cert.untrusted: Certificado no emitido por AC de confianza</faultstring></soapenv:Fault>";
    expect(() => parseLoginResponse(untrustedXml)).toThrow(
      "ARCA no reconoce el certificado. Revisá que sea del mismo entorno (homologación o producción) que elegiste"
    );

    const badXml =
      "<soapenv:Fault><faultcode>soap:Server</faultcode><faultstring>cms.bad: Firma CMS inválida</faultstring></soapenv:Fault>";
    expect(() => parseLoginResponse(badXml)).toThrow(
      "ARCA no reconoce el certificado. Revisá que sea del mismo entorno (homologación o producción) que elegiste"
    );

    const notAuthXml =
      "<soapenv:Fault><faultcode>soap:Server</faultcode><faultstring>coe.notAuthorized: Computador no autorizado a acceder a wsfe</faultstring></soapenv:Fault>";
    expect(() => parseLoginResponse(notAuthXml)).toThrow(
      "El certificado no tiene autorizado el servicio de factura electrónica (wsfe). Asocialo en el portal de ARCA"
    );

    const expiredXml =
      "<soapenv:Fault><faultcode>soap:Server</faultcode><faultstring>cms.cert.expired: Certificado vencido</faultstring></soapenv:Fault>";
    expect(() => parseLoginResponse(expiredXml)).toThrow(
      "El certificado de ARCA está vencido. Generá uno nuevo"
    );

    const genericXml =
      "<soapenv:Fault><faultcode>soap:Server</faultcode><faultstring>Falla de comunicación con base</faultstring></soapenv:Fault>";
    expect(() => parseLoginResponse(genericXml)).toThrow("ARCA rechazó el certificado: Falla de comunicación con base");
  });

  it("certificateExpiry lee la fecha de validez o devuelve null si no puede leerlo", () => {
    const expiry = certificateExpiry(certPem);
    expect(expiry).toBeInstanceOf(Date);
    expect(expiry?.getFullYear()).toBe(2028);
    expect(certificateExpiry("invalido")).toBeNull();
  });

  it("getAccessTicket ante 'ya posee un TA valido' relee arca_settings y lo devuelve si sigue vigente", async () => {
    mockHttpsResponse(500, "<soapenv:Fault><faultstring>El CEE ya posee un TA valido</faultstring></soapenv:Fault>");

    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          wsaa_token: "TOKEN_RECUPERADO",
          wsaa_sign: "SIGN_RECUPERADO",
          wsaa_expires_at: "2026-11-03T20:00:00-03:00",
        },
        error: null,
      }),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain);

    const ticket = await getAccessTicket(
      { cert_pem: certPem, key_pem: keyPem, wsaa_token: null, wsaa_sign: null, wsaa_expires_at: null },
      "https://wsaa",
      NOW
    );
    expect(ticket.token).toBe("TOKEN_RECUPERADO");
  });

  it("getAccessTicket ante 'ya posee un TA valido' falla si el de la base también venció", async () => {
    mockHttpsResponse(500, "<soapenv:Fault><faultstring>El CEE ya posee un TA valido</faultstring></soapenv:Fault>");

    const chain: any = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          wsaa_token: "VENCIDO",
          wsaa_sign: "VENCIDO",
          wsaa_expires_at: "2026-11-03T11:00:00-03:00", // ya venció para NOW (12:00)
        },
        error: null,
      }),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValueOnce(chain);

    await expect(
      getAccessTicket(
        { cert_pem: certPem, key_pem: keyPem, wsaa_token: null, wsaa_sign: null, wsaa_expires_at: null },
        "https://wsaa",
        NOW
      )
    ).rejects.toThrow(/sigue vigente/);
  });

  it("withAccessTicket reintenta una sola vez ante error 600", async () => {
    mockHttpsResponse(
      200,
      "<soapenv:Envelope><soapenv:Body><loginCmsResponse><loginCmsReturn>" +
        "&lt;loginTicketResponse&gt;&lt;header&gt;&lt;expirationTime&gt;2026-11-04T00:00:00-03:00&lt;/expirationTime&gt;&lt;/header&gt;" +
        "&lt;credentials&gt;&lt;token&gt;NUEVO_TOKEN&lt;/token&gt;&lt;sign&gt;NUEVO_SIGN&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;" +
        "</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>"
    );

    const updateChain: any = {
      update: vi.fn(() => updateChain),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

    let attempts = 0;
    const run = vi.fn().mockImplementation(async (auth) => {
      attempts++;
      if (attempts === 1) {
        throw new ArcaError("Validacion de token fallo", "service", [600]);
      }
      return `OK con ${auth.token}`;
    });

    const result = await withAccessTicket(
      {
        cert_pem: certPem,
        key_pem: keyPem,
        wsaa_token: "VIEJO_TOKEN",
        wsaa_sign: "VIEJO_SIGN",
        wsaa_expires_at: "2026-11-03T20:00:00-03:00",
        cuit: "20-12345678-9",
      },
      "https://wsaa",
      run
    );

    expect(result).toBe("OK con NUEVO_TOKEN");
    expect(run).toHaveBeenCalledTimes(2);
    // Verificamos que se borró el ticket guardado
    expect(updateChain.update).toHaveBeenCalledWith({ wsaa_token: null, wsaa_sign: null, wsaa_expires_at: null });
  });

  it("withAccessTicket no reintenta con un código distinto a 600", async () => {
    const run = vi.fn().mockRejectedValue(new ArcaError("Otro error", "service", [10015]));
    await expect(
      withAccessTicket(
        {
          cert_pem: certPem,
          key_pem: keyPem,
          wsaa_token: "T",
          wsaa_sign: "S",
          wsaa_expires_at: "2026-11-03T20:00:00-03:00",
          cuit: "20123456789",
        },
        "https://wsaa",
        run
      )
    ).rejects.toThrow("Otro error");

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("withAccessTicket no reintenta dos veces si el reintento vuelve a tirar 600", async () => {
    mockHttpsResponse(
      200,
      "<soapenv:Envelope><soapenv:Body><loginCmsResponse><loginCmsReturn>" +
        "&lt;loginTicketResponse&gt;&lt;header&gt;&lt;expirationTime&gt;2026-11-04T00:00:00-03:00&lt;/expirationTime&gt;&lt;/header&gt;" +
        "&lt;credentials&gt;&lt;token&gt;T2&lt;/token&gt;&lt;sign&gt;S2&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;" +
        "</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>"
    );

    const updateChain: any = {
      update: vi.fn(() => updateChain),
      eq: vi.fn(() => Promise.resolve({ error: null })),
    };
    vi.mocked(supabaseAdmin.from).mockReturnValue(updateChain);

    const run = vi.fn().mockRejectedValue(new ArcaError("Token inválido", "service", [600]));
    await expect(
      withAccessTicket(
        {
          cert_pem: certPem,
          key_pem: keyPem,
          wsaa_token: "T1",
          wsaa_sign: "S1",
          wsaa_expires_at: "2026-11-03T20:00:00-03:00",
          cuit: "20123456789",
        },
        "https://wsaa",
        run
      )
    ).rejects.toThrow("Token inválido");

    expect(run).toHaveBeenCalledTimes(2);
  });

  it("reusa el ticket guardado si le quedan más de 10 minutos", async () => {
    vi.mocked(https.request).mockClear();
    const ticket = await getAccessTicket(
      { cert_pem: null, key_pem: null, wsaa_token: "T", wsaa_sign: "S", wsaa_expires_at: "2026-11-03T20:00:00-03:00" },
      "https://wsaa",
      NOW
    );
    expect(ticket.token).toBe("T");
    expect(https.request).not.toHaveBeenCalled();
  });

  it("se descifra al firmar: getAccessTicket con key_pem cifrado lo descifra y firma bien", async () => {
    const originalKey = process.env.ARCA_ENCRYPTION_KEY;
    const testSecret = "test-secret-32-chars-long-123456";
    process.env.ARCA_ENCRYPTION_KEY = testSecret;

    try {
      mockHttpsResponse(
        200,
        "<soapenv:Envelope><soapenv:Body><loginCmsResponse><loginCmsReturn>" +
          "&lt;loginTicketResponse&gt;&lt;header&gt;&lt;expirationTime&gt;2026-11-04T00:00:00-03:00&lt;/expirationTime&gt;&lt;/header&gt;" +
          "&lt;credentials&gt;&lt;token&gt;TOKEN_DESCF&lt;/token&gt;&lt;sign&gt;SIGN_DESCF&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;" +
          "</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>"
      );

      const chain: any = {
        update: vi.fn(() => chain),
        eq: vi.fn(() => chain),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(chain);

      const encryptedKey = encryptSecret(keyPem, testSecret);
      const ticket = await getAccessTicket(
        { cert_pem: certPem, key_pem: encryptedKey, wsaa_token: null, wsaa_sign: null, wsaa_expires_at: null },
        "https://wsaa",
        NOW
      );

      expect(ticket.token).toBe("TOKEN_DESCF");
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          wsaa_token: "TOKEN_DESCF",
        })
      );
    } finally {
      process.env.ARCA_ENCRYPTION_KEY = originalKey;
    }
  });

  it("migración perezosa: getAccessTicket con ARCA_ENCRYPTION_KEY y key_pem en texto plano migra a cifrado en arca_settings", async () => {
    const originalKey = process.env.ARCA_ENCRYPTION_KEY;
    const testSecret = "test-secret-32-chars-long-123456";
    process.env.ARCA_ENCRYPTION_KEY = testSecret;

    try {
      mockHttpsResponse(
        200,
        "<soapenv:Envelope><soapenv:Body><loginCmsResponse><loginCmsReturn>" +
          "&lt;loginTicketResponse&gt;&lt;header&gt;&lt;expirationTime&gt;2026-11-04T00:00:00-03:00&lt;/expirationTime&gt;&lt;/header&gt;" +
          "&lt;credentials&gt;&lt;token&gt;TOKEN_MIG&lt;/token&gt;&lt;sign&gt;SIGN_MIG&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;" +
          "</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>"
      );

      const updateCalls: any[] = [];
      const chain: any = {
        update: vi.fn((data) => {
          updateCalls.push(data);
          return chain;
        }),
        eq: vi.fn(() => chain),
      };
      vi.mocked(supabaseAdmin.from).mockReturnValue(chain);

      const config = {
        cert_pem: certPem,
        key_pem: keyPem,
        key_passphrase: "plain-passphrase",
        wsaa_token: null,
        wsaa_sign: null,
        wsaa_expires_at: null,
      };

      const ticket = await getAccessTicket(config, "https://wsaa", NOW);
      expect(ticket.token).toBe("TOKEN_MIG");

      const migrationCall = updateCalls.find((call) => call.key_pem);
      expect(migrationCall).toBeDefined();
      expect(migrationCall.key_pem).toMatch(/^enc:v1:/);
      expect(migrationCall.key_passphrase).toMatch(/^enc:v1:/);
    } finally {
      process.env.ARCA_ENCRYPTION_KEY = originalKey;
    }
  });

  it("migración perezosa: si falla la escritura en la base al migrar, no corta la facturación", async () => {
    const originalKey = process.env.ARCA_ENCRYPTION_KEY;
    const testSecret = "test-secret-32-chars-long-123456";
    process.env.ARCA_ENCRYPTION_KEY = testSecret;

    try {
      mockHttpsResponse(
        200,
        "<soapenv:Envelope><soapenv:Body><loginCmsResponse><loginCmsReturn>" +
          "&lt;loginTicketResponse&gt;&lt;header&gt;&lt;expirationTime&gt;2026-11-04T00:00:00-03:00&lt;/expirationTime&gt;&lt;/header&gt;" +
          "&lt;credentials&gt;&lt;token&gt;TOKEN_OK&lt;/token&gt;&lt;sign&gt;SIGN_OK&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;" +
          "</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>"
      );

      let callCount = 0;
      const migrationChain: any = {
        update: vi.fn(() => migrationChain),
        eq: vi.fn(() => Promise.reject(new Error("DB failure on migration"))),
      };
      const ticketChain: any = {
        update: vi.fn(() => ticketChain),
        eq: vi.fn(() => Promise.resolve({ error: null })),
      };

      vi.mocked(supabaseAdmin.from).mockImplementation((() => {
        callCount++;
        return callCount === 1 ? migrationChain : ticketChain;
      }) as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const config = {
        cert_pem: certPem,
        key_pem: keyPem,
        wsaa_token: null,
        wsaa_sign: null,
        wsaa_expires_at: null,
      };

      const ticket = await getAccessTicket(config, "https://wsaa", NOW);
      expect(ticket.token).toBe("TOKEN_OK");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    } finally {
      process.env.ARCA_ENCRYPTION_KEY = originalKey;
    }
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

  it("Nota de crédito C: incluye CbtesAsoc después de CondicionIVAReceptorId con el orden exacto", () => {
    const xml = buildCaeRequest(auth, {
      ...base,
      voucherType: 13,
      voucherNumber: 2,
      associated: {
        type: 11,
        pointOfSale: 3,
        number: 8,
        cuit: "20-12345678-9",
        date: "2026-11-03",
      },
    });

    expect(xml).toContain("<ar:CbteTipo>13</ar:CbteTipo>");
    expect(xml).toContain("<ar:CbteDesde>2</ar:CbteDesde><ar:CbteHasta>2</ar:CbteHasta>");

    // Orden exacto de etiquetas según WSDL de ARCA:
    // ... CondicionIVAReceptorId -> CbtesAsoc -> FECAEDetRequest cierre
    const expectedCbtes =
      "<ar:CondicionIVAReceptorId>5</ar:CondicionIVAReceptorId>" +
      "<ar:CbtesAsoc><ar:CbteAsoc>" +
      "<ar:Tipo>11</ar:Tipo>" +
      "<ar:PtoVta>3</ar:PtoVta>" +
      "<ar:Nro>8</ar:Nro>" +
      "<ar:Cuit>20123456789</ar:Cuit>" +
      "<ar:CbteFch>20261103</ar:CbteFch>" +
      "</ar:CbteAsoc></ar:CbtesAsoc>" +
      "</ar:FECAEDetRequest>";

    expect(xml).toContain(expectedCbtes);
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

  it("buildConsultVoucher arma el XML con auth, punto de venta y comprobante", () => {
    const xml = buildConsultVoucher(auth, 3, 11, 42);
    expect(xml).toContain("<ar:CbteTipo>11</ar:CbteTipo>");
    expect(xml).toContain("<ar:CbteNro>42</ar:CbteNro>");
    expect(xml).toContain("<ar:PtoVta>3</ar:PtoVta>");
    expect(xml).toContain("<ar:Token>T&amp;1</ar:Token>");
  });

  it("parseConsultVoucher lee un comprobante aprobado", () => {
    const xml =
      "<FECompConsultarResult><ResultGet>" +
      "<Resultado>A</Resultado><CodAutorizacion>76123456789012</CodAutorizacion><FchVto>20261113</FchVto>" +
      "<ImpTotal>12000.00</ImpTotal><DocTipo>80</DocTipo><DocNro>20123456789</DocNro><CbteDesde>42</CbteDesde>" +
      "</ResultGet></FECompConsultarResult>";
    expect(parseConsultVoucher(xml)).toEqual({
      found: true,
      approved: true,
      cae: "76123456789012",
      caeDueDate: "2026-11-13",
      total: 12000,
      docType: 80,
      docNumber: "20123456789",
      voucherNumber: 42,
    });
  });

  it("parseConsultVoucher devuelve found: false si el código es 602 (no existen datos)", () => {
    const xml =
      "<FECompConsultarResult><Errors><Err><Code>602</Code><Msg>No existen datos para los parametros ingresados</Msg></Err></Errors></FECompConsultarResult>";
    expect(parseConsultVoucher(xml)).toEqual({ found: false });
  });

  it("parseConsultVoucher lanza ArcaError si ARCA devuelve otro error de servicio", () => {
    const xml =
      "<FECompConsultarResult><Errors><Err><Code>600</Code><Msg>Validacion de token fallo</Msg></Err></Errors></FECompConsultarResult>";
    expect(() => parseConsultVoucher(xml)).toThrow(ArcaError);
    expect(() => parseConsultVoucher(xml)).toThrow("Validacion de token fallo (600)");
  });

  it("parseConsultVoucher lanza error si la respuesta es un SOAP fault", () => {
    const xml =
      "<soapenv:Fault><faultcode>soapenv:Client</faultcode><faultstring>Mensaje malformado</faultstring></soapenv:Fault>";
    expect(() => parseConsultVoucher(xml)).toThrow(/rechazó el pedido/);
  });

  it("parsePointsOfSale devuelve null si ARCA responde con código 602 (normal en homologación)", () => {
    const xml =
      "<FEParamGetPtosVentaResult><Errors><Err><Code>602</Code><Msg>No existen datos en nuestros registros</Msg></Err></Errors></FEParamGetPtosVentaResult>";
    expect(parsePointsOfSale(xml)).toBeNull();
  });

  it("parsePointsOfSale lanza ArcaError si ARCA devuelve otro error de servicio", () => {
    const xml =
      "<FEParamGetPtosVentaResult><Errors><Err><Code>600</Code><Msg>Validacion de token fallo</Msg></Err></Errors></FEParamGetPtosVentaResult>";
    expect(() => parsePointsOfSale(xml)).toThrow(ArcaError);
    expect(() => parsePointsOfSale(xml)).toThrow("Validacion de token fallo (600)");
  });

  it("parsePointsOfSale parsea correctamente los puntos de venta, bloqueados y dados de baja", () => {
    const xml =
      "<FEParamGetPtosVentaResult><ResultGet>" +
      "<PtoVenta><Nro>1</Nro><EmisionTipo>RECE para aplicativo y web services</EmisionTipo><Bloqueado>N</Bloqueado><FchBaja>NULL</FchBaja></PtoVenta>" +
      "<PtoVenta><Nro>2</Nro><EmisionTipo>Factuweb</EmisionTipo><Bloqueado>S</Bloqueado><FchBaja>NULL</FchBaja></PtoVenta>" +
      "<PtoVenta><Nro>3</Nro><EmisionTipo>RECE</EmisionTipo><Bloqueado>N</Bloqueado><FchBaja>20261101</FchBaja></PtoVenta>" +
      "</ResultGet></FEParamGetPtosVentaResult>";

    const res = parsePointsOfSale(xml);
    expect(res).toEqual([
      { number: 1, emissionType: "RECE para aplicativo y web services", blocked: false, deregistered: false },
      { number: 2, emissionType: "Factuweb", blocked: true, deregistered: false },
      { number: 3, emissionType: "RECE", blocked: false, deregistered: true },
    ]);
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

  it("urlMatchesEnvironment valida que el host corresponda al entorno", () => {
    expect(urlMatchesEnvironment("https://wsaahomo.afip.gov.ar/ws/services/LoginCms", "homo")).toBe(true);
    expect(urlMatchesEnvironment("https://wswhomo.afip.gov.ar/wsfev1/service.asmx", "homo")).toBe(true);
    expect(urlMatchesEnvironment("https://wsaa.afip.gov.ar/ws/services/LoginCms", "homo")).toBe(false);

    expect(urlMatchesEnvironment("https://wsaa.afip.gov.ar/ws/services/LoginCms", "prod")).toBe(true);
    expect(urlMatchesEnvironment("https://servicios1.afip.gov.ar/wsfev1/service.asmx", "prod")).toBe(true);
    expect(urlMatchesEnvironment("https://wsaahomo.afip.gov.ar/ws/services/LoginCms", "prod")).toBe(false);

    expect(urlMatchesEnvironment("not-a-valid-url", "homo")).toBe(false);
  });
});
