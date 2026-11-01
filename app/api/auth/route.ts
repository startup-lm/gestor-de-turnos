import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth";
import { checkBarberLimit } from "@/lib/flags/server";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return errorResponse("Falta el email");

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error || !data?.users?.length) return errorResponse("Usuario no encontrado");

  const user = data.users.find((u) => u.email === email);
  if (!user) return errorResponse("Usuario no encontrado");

  return successResponse();
}

/**
 * Alta de la cuenta de acceso de un profesional. Solo el admin, desde el servidor:
 * así el registro público de Supabase ("Allow new users to sign up") puede quedar apagado.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const body: { email?: string; password?: string } = await request.json();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;
  if (!email || !password) return errorResponse("Faltan el email o la contraseña", 400);
  if (password.length < 6) return errorResponse("La contraseña debe tener al menos 6 caracteres", 400);

  // Si el profesional todavía no existe, la cuenta nueva cuenta para el límite del plan
  const { data: existingBarber, error: barberError } = await supabaseAdmin
    .from("barbers")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (barberError) return dbErrorResponse(barberError, "auth.post");
  if (!existingBarber) {
    const limitError = await checkBarberLimit();
    if (limitError) return limitError;
  }

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    if (error.code === "email_exists" || error.status === 422) return errorResponse("El email ya se encuentra registrado.", 409);
    return dbErrorResponse(error, "auth.post");
  }
  return successResponse();
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const body: { email?: string } = await request.json();
  const email = body.email;
  if (!email) return errorResponse("Falta el email");

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error || !data?.users?.length) return errorResponse("Usuario no encontrado");

  const user = data.users.find((u) => u.email === email);
  if (!user) return errorResponse("Usuario no encontrado");

  const userId = user.id;
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (deleteError) return dbErrorResponse(deleteError, "auth");
  return successResponse();
}
