import type { ArcaInvoiceRecord } from "@/lib/types/Arca";
import { SOURCE_LABELS, DOC_TYPE_LABELS } from "./constants";

export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function exportToCsv(invoices: ArcaInvoiceRecord[]) {
  const headers = [
    "Fecha",
    "Estado",
    "Total",
    "Cliente",
    "CAE",
    "Vto. CAE",
    "Nro.",
    "PV",
    "Origen",
    "Doc. Tipo",
    "Doc. Nro.",
  ];
  const rows = invoices.map((inv) => [
    inv.created_at ? new Date(inv.created_at).toLocaleDateString("es-AR") : "-",
    inv.status,
    inv.total.toFixed(2),
    inv.customer_name ?? "Cons. Final",
    inv.cae ?? "-",
    inv.cae_due_date ?? "-",
    inv.voucher_number ?? "-",
    inv.point_of_sale ?? "-",
    inv.source_type ? SOURCE_LABELS[inv.source_type] ?? inv.source_type : "Manual",
    inv.doc_type ? DOC_TYPE_LABELS[inv.doc_type] ?? String(inv.doc_type) : "-",
    inv.doc_number ?? "-",
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comprobantes_arca_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
