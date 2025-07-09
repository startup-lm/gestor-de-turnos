/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { revalidateTag } from "next/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let query = supabaseAdmin
    .from("appointments")
    .select(`*, barbers(name), services(name)`);
  for (const [key, value] of searchParams.entries()) {
    if (key === "start_date") {
      query = query.gte("date", value);
    } else if (key === "end_date") {
      query = query.lte("date", value);
    } else if (key === "date") {
      query = query.eq("date", value);
    } else {
      query = query.eq(key, value);
    }
  }
  const { data, error } = await query.order("start_time", { ascending: true });
  if (error) return errorResponse(error.message);
  const formatted = data.map(item => ({
    ...item,
    start_time: item.start_time?.slice(0, 5) ?? item.start_time,
    end_time: item.end_time?.slice(0, 5) ?? item.end_time,
  }));
  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const { client, barber_id, date, start_time, end_time, phone, service_id, }: { client: string; barber_id: number; date: string; start_time: string; end_time: string; phone: string; service_id: number; } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .insert({
      client,
      barber_id,
      date: date.split("T")[0],
      start_time: `${start_time}:00`,
      end_time: `${end_time}:00`,
      phone,
      service_id
    })
    .select("id");

  if (error) return errorResponse(error.message);
  revalidateTag("appointments");
  return NextResponse.json({ success: true, id: data?.[0]?.id });
}

export async function PUT(request: Request) {
  const { appointmentId, isPaid, price }: { appointmentId: number; isPaid: boolean; price: number } =
    await request.json();

  const { error } = await supabaseAdmin
    .from("appointments")
    .update({ paid: isPaid, price })
    .eq("id", appointmentId);

  if (error) return errorResponse(error.message);
  revalidateTag("appointments");
  return successResponse();
}

export async function DELETE(request: Request) {
  const { id }: { id: number } = await request.json();
  const { data, error } = await supabaseAdmin
    .from("appointments")
    .delete()
    .eq("id", id)
    .select();
  if (error) return errorResponse(error.message);
  if (!data || data.length === 0) return errorResponse("No existe ese número de turno", 404);
  revalidateTag("appointments");
  return successResponse();
}

export async function PATCH(request: Request) {
  const { appointmentId, updates }: { appointmentId: number; updates: Record<string, any>; } = await request.json();
  const { error } = await supabaseAdmin
    .from("appointments")
    .update(updates)
    .eq("id", appointmentId);

  if (error) return errorResponse(error.message);
  revalidateTag("appointments");
  return successResponse();
}