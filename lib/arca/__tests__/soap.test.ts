/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import https from "node:https";
import EventEmitter from "node:events";
import { postXml, soapRequest } from "@/lib/arca/soap";

vi.mock("node:https", () => ({
  default: {
    Agent: vi.fn(),
    request: vi.fn(),
  },
}));

describe("soap.ts TLS y postXml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rechaza si la URL no empieza con https:// sin intentar conectar", async () => {
    await expect(postXml("http://inseguro.afip.gov.ar", "<xml/>", {}, 1000)).rejects.toThrow(
      "La dirección de ARCA tiene que empezar con https://"
    );
    expect(https.request).not.toHaveBeenCalled();
  });

  it("postXml envía el XML vía https y resuelve statusCode y text", async () => {
    const mockReq: any = new EventEmitter();
    mockReq.setTimeout = vi.fn();
    mockReq.destroy = vi.fn();
    mockReq.write = vi.fn();
    mockReq.end = vi.fn();

    vi.mocked(https.request).mockImplementation((_url, _opts, callback: any) => {
      const mockRes: any = new EventEmitter();
      mockRes.statusCode = 200;
      setTimeout(() => {
        callback(mockRes);
        mockRes.emit("data", Buffer.from("<response>OK</response>"));
        mockRes.emit("end");
      }, 0);
      return mockReq;
    });

    const res = await postXml("https://servicios1.afip.gov.ar/wsfev1/service.asmx", "<xml/>", {}, 5000);
    expect(res).toEqual({ status: 200, text: "<response>OK</response>" });
    expect(mockReq.write).toHaveBeenCalledWith("<xml/>");
    expect(mockReq.end).toHaveBeenCalled();
  });

  it("soapRequest devuelve el texto si el status es 200", async () => {
    const mockReq: any = new EventEmitter();
    mockReq.setTimeout = vi.fn();
    mockReq.destroy = vi.fn();
    mockReq.write = vi.fn();
    mockReq.end = vi.fn();

    vi.mocked(https.request).mockImplementation((_url, _opts, callback: any) => {
      const mockRes: any = new EventEmitter();
      mockRes.statusCode = 200;
      setTimeout(() => {
        callback(mockRes);
        mockRes.emit("data", Buffer.from("<soap:Envelope>OK</soap:Envelope>"));
        mockRes.emit("end");
      }, 0);
      return mockReq;
    });

    const text = await soapRequest("https://servicios1.afip.gov.ar/wsfe", "<body/>", "action");
    expect(text).toBe("<soap:Envelope>OK</soap:Envelope>");
  });

  it("soapRequest devuelve el texto si es 500 pero incluye Fault", async () => {
    const mockReq: any = new EventEmitter();
    mockReq.setTimeout = vi.fn();
    mockReq.destroy = vi.fn();
    mockReq.write = vi.fn();
    mockReq.end = vi.fn();

    vi.mocked(https.request).mockImplementation((_url, _opts, callback: any) => {
      const mockRes: any = new EventEmitter();
      mockRes.statusCode = 500;
      setTimeout(() => {
        callback(mockRes);
        mockRes.emit("data", Buffer.from("<soap:Fault>Error interno</soap:Fault>"));
        mockRes.emit("end");
      }, 0);
      return mockReq;
    });

    const text = await soapRequest("https://servicios1.afip.gov.ar/wsfe", "<body/>");
    expect(text).toContain("<soap:Fault>");
  });

  it("soapRequest lanza ArcaError network si el status no es 2xx y no tiene Fault", async () => {
    const mockReq: any = new EventEmitter();
    mockReq.setTimeout = vi.fn();
    mockReq.destroy = vi.fn();
    mockReq.write = vi.fn();
    mockReq.end = vi.fn();

    vi.mocked(https.request).mockImplementation((_url, _opts, callback: any) => {
      const mockRes: any = new EventEmitter();
      mockRes.statusCode = 502;
      setTimeout(() => {
        callback(mockRes);
        mockRes.emit("data", Buffer.from("Bad Gateway"));
        mockRes.emit("end");
      }, 0);
      return mockReq;
    });

    await expect(soapRequest("https://servicios1.afip.gov.ar/wsfe", "<body/>")).rejects.toThrow(
      "ARCA respondió con un error (502)"
    );
  });

  it("soapRequest lanza ArcaError network si hay error de red o timeout", async () => {
    const mockReq: any = new EventEmitter();
    mockReq.setTimeout = vi.fn((_ms, cb) => cb());
    mockReq.destroy = vi.fn((err) => mockReq.emit("error", err));
    mockReq.write = vi.fn();
    mockReq.end = vi.fn();

    vi.mocked(https.request).mockImplementation(() => mockReq);

    await expect(soapRequest("https://servicios1.afip.gov.ar/wsfe", "<body/>")).rejects.toThrow(
      "ARCA no respondió. Revisá en Facturas antes de reintentar"
    );
  });
});
