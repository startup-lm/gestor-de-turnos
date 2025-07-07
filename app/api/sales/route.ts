import { NextResponse } from "next/server";

import { successResponse, errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { revalidateTag } from "next/cache";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("sales")
    .select()
    .order("id", { ascending: true });

  if (error) return errorResponse(error.message);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { barber_id, product_id, price, quantity, details, total } = await request.json();
  const { error } = await supabaseAdmin
    .from("sales")
    .insert({ barber_id, product_id, price, quantity, details, total});

  if (error) return errorResponse(error.message);
  revalidateTag("sales");
  return successResponse();
}