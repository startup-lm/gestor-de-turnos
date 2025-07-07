import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { successResponse, errorResponse } from "@/lib/api/response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return errorResponse("Falta el email");

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error || !data?.users?.length) return errorResponse("Usuario no encontrado");

  const user = data.users.find((u) => u.email === email);
  if (!user) return errorResponse("Usuario no encontrado");

  return successResponse();
}

export async function DELETE(request: Request) {
  const body: { email?: string } = await request.json();
  const email = body.email;
  if (!email) return errorResponse("Falta el email");

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error || !data?.users?.length) return errorResponse("Usuario no encontrado");

  const user = data.users.find((u) => u.email === email);
  if (!user) return errorResponse("Usuario no encontrado");

  const userId = user.id;
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (deleteError) return errorResponse(deleteError.message);
  return successResponse();
}
