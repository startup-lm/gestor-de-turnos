import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { successResponse, errorResponse, dbErrorResponse } from "@/lib/api/response";
import { parseBody } from "@/lib/api/parseBody";
import { AuthCreateUserSchema, AuthDeleteUserSchema } from "@/lib/schemas";
import { requireAdmin } from "@/lib/api/auth";
import { findAuthUserByEmail } from "@/lib/auth/findAuthUser";
import { checkBarberLimit } from "@/lib/flags/server";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return errorResponse("Falta el email");

  const user = await findAuthUserByEmail(email);
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

  const { data: body, error: bodyError } = await parseBody(request, AuthCreateUserSchema);
  if (bodyError) return bodyError;

  const { email, password } = body;

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

  const { data: body, error: bodyError } = await parseBody(request, AuthDeleteUserSchema);
  if (bodyError) return bodyError;

  const { email } = body;
  const user = await findAuthUserByEmail(email);
  if (!user) return errorResponse("Usuario no encontrado");

  const userId = user.id;
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (deleteError) return dbErrorResponse(deleteError, "auth");
  return successResponse();
}
