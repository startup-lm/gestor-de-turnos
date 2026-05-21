import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .select("slot_step_minutes, phone, payment_methods, social_media, our_story, location_address, local_photo")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const payload = await req.json();
  const { data, error } = await supabaseAdmin
    .from("business_settings")
    .upsert({ id: 1, ...payload })
    .select("slot_step_minutes, phone, payment_methods, social_media, our_story, location_address, local_photo")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateTag("business-settings");
  return NextResponse.json(data);
}
