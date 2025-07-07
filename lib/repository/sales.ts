import { Sale } from "../types/Sale";

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