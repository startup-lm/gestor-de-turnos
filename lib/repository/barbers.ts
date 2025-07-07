/* eslint-disable @typescript-eslint/no-explicit-any */
import { Barber } from "../types/Barbers";

const BASE = process.env.NEXT_PUBLIC_APP_URL!

export const getBarbers = async (): Promise<Barber[]> => {
  const res = await fetch(`${BASE}/api/barbers`);
  if (!res.ok) return [];
  return res.json();
};

export const getIdAndRole = async (email: string): Promise<{ id: number; role: string } | null> => {
  const res = await fetch(`${BASE}/api/barbers?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  const barber = await res.json();
  return barber ? { id: barber.id, role: barber.role } : null;
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
  const res = await fetch(`${BASE}/api/barbers?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  return res.json();
};

export const updateBarber = async (id: number,values: Record<string, any>): Promise<boolean> => {
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
  const res = await fetch(`${BASE}/api/barbers?id=${id}`, { next: {tags: ["barbers"], revalidate: 60}, });
  if (!res.ok) {
    const emptyBarber = {id: id,  name: "", role: "barber", image: "", email: "", instagram: "" } as Barber;
    return emptyBarber
  }
  return res.json();
}