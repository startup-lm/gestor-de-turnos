import { Client } from "../types/Client";

const BASE = process.env.NEXT_PUBLIC_APP_URL!;

/**
 * Busca clientes por nombre (texto) o teléfono (numérico).
 * Usado por el autocomplete del lado barbero.
 */
export async function searchClients(query: string): Promise<Client[]> {
  if (!query || query.length < 2) return [];
  const params = new URLSearchParams({ search: query });
  const res = await fetch(`${BASE}/api/clients?${params}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

/**
 * Upsert por teléfono:
 * - Si el teléfono ya existe → actualiza last_visit_date, preserva el nombre original.
 * - Si no existe → crea el cliente nuevo.
 * Retorna el cliente resultante (con su id).
 */
export async function upsertClient(name: string, phone: string): Promise<Client | null> {
  if (!name || !phone) return null;
  const res = await fetch(`${BASE}/api/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone }),
  });
  if (!res.ok) return null;
  return res.json();
}
