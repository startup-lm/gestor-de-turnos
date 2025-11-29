import { Sale, SaleWithRelations } from "../types/Sale";

const BASE = process.env.NEXT_PUBLIC_APP_URL!;

export async function createSale(sale: Sale): Promise<boolean> {
  const res = await fetch(`${BASE}/api/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sale),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}

export async function getTotalRevenueForAllSales(start_date: Date,end_date: Date) {
  const params = new URLSearchParams({
    start_date: start_date.toISOString().split("T")[0],
    end_date: end_date.toISOString().split("T")[0],
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

export async function getSalesPage( page: number = 1, pageSize: number = 10 ): Promise<{data: SaleWithRelations[]; total: number; page: number; pageSize: number;}> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), });
  const res = await fetch(`${BASE}/api/sales/list?${params.toString()}`, {
    next: { tags: ["sales"] },
  });

  if (!res.ok) { return { data: [], total: 0, page, pageSize, }; }
  const json = await res.json();
  return {data: (json.data ?? []) as SaleWithRelations[], total: json.total ?? 0, page: json.page ?? page, pageSize: json.pageSize ?? pageSize, };
}

export async function updateSale( id: number, payload: Partial<Pick<Sale, "price" | "quantity" | "total" | "details">> ): Promise<boolean> {
  const res = await fetch(`${BASE}/api/sales/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}

export async function deleteSale(id: number): Promise<boolean> {
  const res = await fetch(`${BASE}/api/sales/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}