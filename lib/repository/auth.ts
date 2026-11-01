import { supabaseClient } from "../supabase/supabaseClient";

import { getBaseUrl } from "@/utils/getBaseUrl";
const BASE = getBaseUrl();

/** Crea la cuenta de acceso de un profesional (solo admin, vía servidor). Devuelve el mensaje de error o null. */
export const createStaffAccount = async (email: string, password: string): Promise<string | null> => {
  const res = await fetch(`${BASE}/api/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return null;
  const body = await res.json().catch(() => null);
  return body?.error ?? "Error al registrar la cuenta de usuario.";
};

export async function resetPassword(email: string) {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${BASE}/recuperar-contrasena`,
  });
  return error;
}

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabaseClient.auth.updateUser({ password: newPassword, });
  if (!data || error) return false;
  return true;
};

export async function deleteAuthUser(email: string): Promise<boolean> {
  const res = await fetch(`${BASE}/api/auth`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) return false;
  const { success } = await res.json();
  return success;
};

export const isBarberAuthenticated = async (email: string): Promise<boolean> => {
  const res = await fetch(`${BASE}/api/auth?email=${encodeURIComponent(email)}`, {
    method: "GET",
  });
  return res.ok;
};