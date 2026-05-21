import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("business_hours_global")
    .select("open_time, close_time, lunch_start, lunch_end, closed_days")
    .eq("id", 1)
    .single();

  if (error || !data) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payload = await req.json();
  const { data, error } = await supabaseAdmin
    .from("business_hours_global")
    .upsert({ id: 1, ...payload })
    .select("open_time, close_time, lunch_start, lunch_end, closed_days")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("business-hours");
  return NextResponse.json(data);
}
