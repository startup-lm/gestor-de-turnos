export type ArcaEnvironment = "homo" | "prod";

export type ArcaConfig = {
  environment: ArcaEnvironment;
  cuit: string | null;
  point_of_sale: number | null;
  wsaa_url: string | null;
  wsfe_url: string | null;
  has_cert: boolean;
  has_key: boolean;
  has_passphrase?: boolean;
};

export type ArcaConfigUpdate = {
  environment?: ArcaEnvironment;
  cuit?: string | null;
  pointOfSale?: number | null;
  wsaaUrl?: string | null;
  wsfeUrl?: string | null;
  certPem?: string;
  keyPem?: string;
  keyPassphrase?: string | null;
};

export type ArcaStatus = {
  environment: ArcaEnvironment;
  ready: boolean;
  cuit: string | null;
  point_of_sale: number | null;
  has_cert: boolean;
  has_key: boolean;
  wsaa_url: string | null;
  wsfe_url: string | null;
};

export type ArcaSourceType = "appointment" | "sale" | "manual";

export type ArcaDocType = 80 | 86 | 96 | 99; // 80=CUIT, 86=CUIL, 96=DNI, 99=Consumidor Final

export type ArcaEmitInput = {
  total: number;
  customerName?: string;
  docType?: ArcaDocType;
  docNumber?: string;
  receiverIvaCondition?: number;
  sourceType?: ArcaSourceType;
  sourceId?: number;
};

export type ArcaEmitResult = {
  success: boolean;
  error?: string;
  invoiceId?: number;
  cae?: string;
  caeDueDate?: string;
  voucherNumber?: number;
  voucherType?: number;
  pointOfSale?: number;
};

export type ArcaInvoiceRecord = {
  id: number;
  created_at: string;
  status: string;
  total: number;
  customer_name: string | null;
  cae: string | null;
  cae_due_date: string | null;
  voucher_number: number | null;
  voucher_type: number | null;
  point_of_sale: number | null;
  source_type: ArcaSourceType | null;
  source_id: number | null;
  doc_type: number | null;
  doc_number: string | null;
  invoice_type: number | null;
  receiver_iva_condition: number | null;
  error_message: string | null;
};

export type ArcaInvoiceStatus = "pending" | "approved" | "rejected" | "error";

export type ArcaTestResult = {
  success: boolean;
  steps: { label: string; ok: boolean; detail: string }[];
};
