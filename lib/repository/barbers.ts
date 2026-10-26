/* eslint-disable @typescript-eslint/no-explicit-any */
import { Barber } from "../types/Barbers";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

export const getBarbers = async (): Promise<Barber[]> => {
  if (typeof window === "undefined") {
    try {
      const { supabaseAdmin } = await import("@/lib/supabase/supabaseAdmin");
      const { data, error } = await supabaseAdmin
        .from("barbers")
        .select("id, email, name, image, instagram, role, active, commission, sale_commission")
        .eq("active", true)
        .order("id", { ascending: true });
      if (error || !data) return [];
      return data;
    } catch (e) {
      console.error("getBarbers server query error:", e);
      return [];
    }
  }

  try {
    const res = await fetch(`${BASE}/api/barbers`);
    if (!res.ok) return [];
    const text = await res.text();
    if (!text.trim().startsWith("[")) return [];
    return JSON.parse(text);
  } catch (err) {
    console.error("getBarbers error:", err);
    return [];
  }
};

export const getIdAndRole = async (email: string): Promise<{ id: number; role: string } | null> => {
  try {
    const res = await fetch(`${BASE}/api/barbers?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("{")) return null;
    const barber = JSON.parse(text);
    return barber ? { id: barber.id, role: barber.role } : null;
  } catch (err) {
    console.error("getIdAndRole error:", err);
    return null;
  }
};

export const addBarber = async (values: Barber): Promise<Barber | null> => {
  const res = await fetch(`${BASE}/api/barbers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  if (!res.ok) return null;
  return res.json();
};

export const deleteBarber = async (id: number): Promise<boolean> => {
  const res = await fetch(`${BASE}/api/barbers`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
};

export const getBarberByEmail = async (email: string): Promise<Barber | null> => {
  try {
    const res = await fetch(`${BASE}/api/barbers?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim().startsWith("{")) return null;
    return JSON.parse(text);
  } catch (err) {
    console.error("getBarberByEmail error:", err);
    return null;
  }
};

export const updateBarber = async (id: number, values: Record<string, any>): Promise<boolean> => {
  const res = await fetch(`${BASE}/api/barbers`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...values }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
};

export async function getBarberById(id: number): Promise<Barber> {
  const emptyBarber = { id: id, name: "", role: "barber", image: "", email: "", instagram: "" } as Barber;
  try {
    const res = await fetch(`${BASE}/api/barbers?id=${id}`, { next: { tags: ["barbers"], revalidate: 60 }, });
    if (!res.ok) return emptyBarber;
    const text = await res.text();
    if (!text.trim().startsWith("{")) return emptyBarber;
    return JSON.parse(text);
  } catch (err) {
    console.error("getBarberById error:", err);
    return emptyBarber;
  }
}