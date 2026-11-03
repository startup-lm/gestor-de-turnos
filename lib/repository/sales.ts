import { Sale, SaleWithRelations } from "../types/Sale";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

export async function createSale(sale: Sale): Promise<{ success: boolean; id?: number; error?: string }> {
  const res = await fetch(`${BASE}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { success: false, error: json?.error };
  }
  const json = await res.json();
  return { success: json.success ?? false, id: json.id };
}

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export async function getTotalRevenueForAllSales(start_date: Date, end_date: Date) {
  const params = new URLSearchParams({
    start_date: formatLocalDate(start_date),
    end_date: formatLocalDate(end_date),
  });
  const res = await fetch(`${BASE}/api/sales/all?${params}`, {
    next: { tags: ["sales"]},
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getBarberSalesFromDates(barberId: number, startDate: Date, endDate: Date) {
  const params = new URLSearchParams({ barber_id: String(barberId), start_date: startDate.toISOString().split("T")[0], end_date: endDate.toISOString().split("T")[0], });
  const res = await fetch(`${BASE}/api/sales/barber?${params}`, {
    next: { tags: ["sales"] },
  });
  if (!res.ok) return [];
  return res.json();
}

export async function getSalesPage(
  page: number = 1,
  pageSize: number = 10,
  startDate?: string,
  endDate?: string
): Promise<{ data: SaleWithRelations[]; total: number; page: number; pageSize: number; }> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  const res = await fetch(`${BASE}/api/sales/list?${params.toString()}`, {
    next: { tags: ["sales"] },
  });

  if (!res.ok) { return { data: [], total: 0, page, pageSize }; }
  const json = await res.json();
  return {
    data: (json.data ?? []) as SaleWithRelations[],
    total: json.total ?? 0,
    page: json.page ?? page,
    pageSize: json.pageSize ?? pageSize,
  };
}

export async function getSales(startDate?: string, endDate?: string): Promise<SaleWithRelations[]> {
  const params = new URLSearchParams();
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  const res = await fetch(`${BASE}/api/sales/list?${params.toString()}`, {
    next: { tags: ["sales"] },
  });

  if (!res.ok) return [];
  const json = await res.json();
  return (json.data ?? []) as SaleWithRelations[];
}

export async function getSaleById(id: number): Promise<SaleWithRelations | null> {
  if (typeof window === "undefined") {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase/supabaseAdmin");
      const { data, error } = await supabaseAdmin
        .from("sales")
        .select("*, barbers(name), products(name), arca_invoices(*)")
        .eq("id", id)
        .single();
      if (error || !data) return null;
      return data as SaleWithRelations;
    } catch (e) {
      console.error("getSaleById server error:", e);
      return null;
    }
  }

  try {
    const res = await fetch(`${BASE}/api/sales/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("getSaleById client error:", err);
    return null;
  }
}

export async function updateSale(
  id: number,
  payload: Partial<Pick<Sale, "barber_id" | "product_id" | "price" | "quantity" | "total" | "details">>
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${BASE}/api/sales/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    return { success: false, error: json?.error ?? "Error al actualizar la venta" };
  }
  const json = await res.json().catch(() => ({}));
  return { success: json?.success ?? true };
}

export async function deleteSale(id: number): Promise<boolean> {
  const res = await fetch(`${BASE}/api/sales/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}