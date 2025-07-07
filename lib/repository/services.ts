import { Service } from "../types/Services";

const BASE = process.env.NEXT_PUBLIC_APP_URL!

export interface ServiceParams {
  id?: number;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export const getServices = async (): Promise<Service[]> => {
  const res = await fetch(`${BASE}/api/services`, {
    next: { tags: ["services"] },
  });
  return res.ok ? res.json() : [];
};

export async function createService({name,description,price,image,}: ServiceParams): Promise<boolean> {
  const res = await fetch(`${BASE}/api/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, price, image }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}

export async function updateService({id,name,description,price,image,}: ServiceParams): Promise<boolean> {
  const res = await fetch(`${BASE}/api/services`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name, description, price, image }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}

export async function deleteService(id: number): Promise<boolean> {
  const res = await fetch(`${BASE}/api/services`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}