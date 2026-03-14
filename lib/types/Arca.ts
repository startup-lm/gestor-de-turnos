export type ArcaEnvironment = "mock" | "homo" | "prod";

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

export type ArcaEmitInput = {
  total: number;
  customerName?: string;
  docType?: number;
  docNumber?: string;
  voucherType?: number;
};

export type ArcaEmitResult = {
  success: boolean;
  error?: string;
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
};
