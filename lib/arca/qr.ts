export type ArcaQrPayload = {
  ver: 1;
  fecha: string;
  cuit: number;
  ptoVta: number;
  tipoCmp: number;
  nroCmp: number;
  importe: number;
  moneda: "PES";
  ctz: 1;
  tipoDocRec: number;
  nroDocRec: number;
  tipoCodAut: "E";
  codAut: number;
};

export type ArcaQrInvoiceInput = {
  voucher_date?: string | null;
  created_at?: string | null;
  point_of_sale?: number | null;
  voucher_type?: number | null;
  invoice_type?: number | null;
  voucher_number?: number | null;
  total: number;
  doc_type?: number | null;
  doc_number?: string | null;
  cae?: string | null;
};

export function buildArcaQrPayload(
  invoice: ArcaQrInvoiceInput,
  cuit: string | number
): ArcaQrPayload {
  const cuitNum = Number(String(cuit).replace(/\D/g, ""));
  const ptoVta = Number(invoice.point_of_sale ?? 0);
  const tipoCmp = Number(invoice.invoice_type ?? invoice.voucher_type ?? 11);
  const nroCmp = Number(invoice.voucher_number ?? 0);
  const importe = Math.round(Number(invoice.total) * 100) / 100;
  const fecha = invoice.voucher_date
    ? invoice.voucher_date.slice(0, 10)
    : invoice.created_at
    ? invoice.created_at.slice(0, 10)
    : "";
  const tipoDocRec = Number(invoice.doc_type ?? 99);
  const docDigits = invoice.doc_number ? String(invoice.doc_number).replace(/\D/g, "") : "";
  const nroDocRec = tipoDocRec === 99 || !docDigits ? 0 : Number(docDigits);
  const codAut = invoice.cae ? Number(String(invoice.cae).replace(/\D/g, "")) : 0;

  return {
    ver: 1,
    fecha,
    cuit: cuitNum,
    ptoVta,
    tipoCmp,
    nroCmp,
    importe,
    moneda: "PES",
    ctz: 1,
    tipoDocRec,
    nroDocRec,
    tipoCodAut: "E",
    codAut,
  };
}

export function buildArcaQrUrl(
  invoice: ArcaQrInvoiceInput,
  cuit: string | number
): string {
  const payload = buildArcaQrPayload(invoice, cuit);
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, "utf-8").toString("base64");
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`;
}
