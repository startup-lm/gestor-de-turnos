import { createSupabaseServerClient } from "@/lib/supabase/supabaseServer";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

/**
 * Verifica si hay una sesión activa y si el usuario tiene rol 'admin'.
 * Retorna el objeto `user` si es admin, o `null` si no lo es o no está autenticado.
 */
export async function requireAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
      return null;
    }

    // Consultar el rol del barbero en la base de datos
    const { data: barber, error } = await supabaseAdmin
      .from("barbers")
      .select("role, active")
      .eq("email", user.email)
      .single();

    if (error || !barber || !barber.active || barber.role !== "admin") {
      return null;
    }

    return user;
  } catch (err) {
    console.error("requireAdmin error:", err);
    return null;
  }
}

/**
 * Verifica si hay una sesión activa y si el usuario tiene rol 'barber' o 'admin'.
 * Retorna el objeto { user, barber } si está autorizado, o `null` si no lo está.
 */
export async function requireBarberOrAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return null;
    }

    // Consultar el rol del barbero en la base de datos
    const { data: barber, error } = await supabaseAdmin
      .from("barbers")
      .select("id, role, active")
      .eq("email", user.email)
      .single();

    if (error || !barber || !barber.active) {
      return null;
    }

    if (barber.role !== "admin" && barber.role !== "barber") {
      return null;
    }

    return { user, barber };
  } catch (err) {
    console.error("requireBarberOrAdmin error:", err);
    return null;
  }
}
