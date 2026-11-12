import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import type { User } from "@supabase/supabase-js";

/**
 * Busca un usuario de autenticación por email paginando los resultados de listUsers.
 * La comparación de emails no distingue mayúsculas ni minúsculas.
 */
export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) {
      return null;
    }

    const found = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail
    );
    if (found) {
      return found;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page++;
  }
}
