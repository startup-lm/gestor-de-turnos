import { Product } from "../types/Product";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

export interface ProductParams {
  id?: number;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const res = await fetch(`${BASE}/api/products`, {
      next: { tags: ["products"] },
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim().startsWith("[")) return [];
    return JSON.parse(text);
  } catch (err) {
    console.error("getProducts error:", err);
    return [];
  }
};

export async function createProduct({name,description,price,image,}: ProductParams): Promise<boolean> {
  const res = await fetch(`${BASE}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description, price, image }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}

export async function updateProduct({id,name,description,price,image,}: ProductParams): Promise<boolean> {
  const res = await fetch(`${BASE}/api/products`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name, description, price, image }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const res = await fetch(`${BASE}/api/products`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
}