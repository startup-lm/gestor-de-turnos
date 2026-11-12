import { describe, it, expect } from "vitest";
import { buildArcaQrPayload, buildArcaQrUrl } from "@/lib/arca/qr";

describe("ARCA: QR de comprobantes fiscales", () => {
  const invoice = {
    voucher_date: "2026-11-12",
    point_of_sale: 3,
    voucher_type: 11,
    invoice_type: 11,
    voucher_number: 42,
    total: 15000.5,
    doc_type: 96,
    doc_number: "40.123.456",
    cae: "76123456789012",
  };
  const cuit = "20-12345678-9";

  it("genera el payload con los campos y tipos oficiales exigidos por ARCA", () => {
    const payload = buildArcaQrPayload(invoice, cuit);
    expect(payload).toEqual({
      ver: 1,
      fecha: "2026-11-12",
      cuit: 20123456789,
      ptoVta: 3,
      tipoCmp: 11,
      nroCmp: 42,
      importe: 15000.5,
      moneda: "PES",
      ctz: 1,
      tipoDocRec: 96,
      nroDocRec: 40123456,
      tipoCodAut: "E",
      codAut: 76123456789012,
    });
  });

  it("para consumidor final (doc_type 99) nroDocRec es 0", () => {
    const payload = buildArcaQrPayload(
      { ...invoice, doc_type: 99, doc_number: "" },
      cuit
    );
    expect(payload.tipoDocRec).toBe(99);
    expect(payload.nroDocRec).toBe(0);
  });

  it("construye la URL oficial de AFIP con base64 de JSON compacto", () => {
    const url = buildArcaQrUrl(invoice, cuit);
    const prefix = "https://www.afip.gob.ar/fe/qr/?p=";
    expect(url.startsWith(prefix)).toBe(true);

    const b64 = url.slice(prefix.length);
    const decoded = Buffer.from(b64, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);

    expect(parsed).toEqual(buildArcaQrPayload(invoice, cuit));
    // Verifica que sea JSON compacto sin espacios
    expect(decoded).toBe(JSON.stringify(parsed));
  });

  it("soporta Nota de crédito C (tipoCmp 13)", () => {
    const cnInvoice = {
      ...invoice,
      voucher_type: 13,
      invoice_type: 13,
      voucher_number: 5,
    };
    const url = buildArcaQrUrl(cnInvoice, cuit);
    const prefix = "https://www.afip.gob.ar/fe/qr/?p=";
    const b64 = url.slice(prefix.length);
    const parsed = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
    expect(parsed.tipoCmp).toBe(13);
    expect(parsed.nroCmp).toBe(5);
  });

  it("una factura sin voucher_date con created_at en UTC nocturno usa la fecha argentina", () => {
    const payload = buildArcaQrPayload(
      {
        ...invoice,
        voucher_date: null,
        created_at: "2026-11-12T01:30:00Z", // 22:30 del 11 de noviembre en Argentina (UTC-3)
      },
      cuit
    );
    expect(payload.fecha).toBe("2026-11-11");
  });
});
