import { Product } from "../types/Product";

const BASE = process.env.NEXT_PUBLIC_APP_URL!

export interface ProductParams {
  id?: number;
  name: string;
  description: string;
  price: number;
  image?: string;
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await fetch(`${BASE}/api/products`, {
    next: { tags: ["products"] },
  });
  return res.ok ? res.json() : [];
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