import { supabaseClient } from "../supabase/supabaseClient";

const BASE = process.env.NEXT_PUBLIC_APP_URL!

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  })
  return { data, error }
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