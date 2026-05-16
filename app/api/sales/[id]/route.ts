import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { successResponse, errorResponse } from "@/lib/api/response";
import { revalidateTag } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }
  const body = await request.json();
  const { price, quantity, total, details } = body as {
    price?: number;
    quantity?: number;
    total?: number;
    details?: string;
  };

  const { error } = await supabaseAdmin
    .from("sales")
    .update({ price, quantity, total, details })
    .eq("id", id);

  if (error) return errorResponse(error.message);

  revalidateTag("sales");
  return successResponse();
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (Number.isNaN(id)) { return errorResponse("ID inválido", 400); }
  const { error } = await supabaseAdmin
    .from("sales")
    .delete()
    .eq("id", id);
  if (error) return errorResponse(error.message);
  revalidateTag("sales");
  return successResponse();
}
