import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { requireAdmin } from "@/lib/api/auth";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .select("slot_step_minutes, phone, payment_methods, social_media, our_story, location_address, local_photo, assignment_criteria, business_name, business_logo")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const payload = await req.json();
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .upsert({ id: 1, ...payload })
    .select("slot_step_minutes, phone, payment_methods, social_media, our_story, location_address, local_photo, assignment_criteria, business_name, business_logo")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("business-settings");
  return NextResponse.json(data);
}
