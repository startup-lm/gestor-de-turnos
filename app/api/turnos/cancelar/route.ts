import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { checkRateLimit, getClientIp } from "@/lib/api/rateLimit";
import { arePhonesEqual, formatPhoneDisplay } from "@/utils/phone";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  // Rate limiting por IP para prevenir ataques de fuerza bruta sobre IDs y teléfonos
  const ip = getClientIp(request);

  const limitResult = await checkRateLimit(`cancel-turnos-${ip}`, 12, 60000);
  if (!limitResult.success) {
    return errorResponse(
      "Has superado el límite de intentos permitidos por minuto. Por favor, aguarda un instante.",
      429
    );
  }

  let body: { action?: string; id?: number | string; phone?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Cuerpo de solicitud inválido", 400);
  }

  const { action, id, phone } = body || {};
  const numericId = Number(id);

  if (!numericId || numericId <= 0 || !phone || typeof phone !== "string") {
    return errorResponse("Por favor completá el número de turno y teléfono", 400);
  }

  // Buscar el turno activo en Supabase con privilegios admin
  const { data: appt, error: findError } = await supabaseAdmin
    .from("appointments")
    .select("*, barbers(name), services(name)")
    .eq("id", numericId)
    .is("deleted_at", null)
    .maybeSingle();

  if (findError) {
    console.error("Error buscando turno para cancelar:", findError);
    return errorResponse("Error en el servidor al buscar el turno", 500);
  }

  if (!appt) {
    return errorResponse("No existe ningún turno activo con ese número", 404);
  }

  if (appt.arca_invoice_id) {
    return errorResponse("Este turno posee comprobante fiscal emitido y no puede cancelarse online", 400);
  }

  if (appt.paid) {
    return errorResponse("Este turno ya fue cobrado y no es posible cancelarlo online", 400);
  }

  if (appt.phone === "0000000000" || appt.type === "block") {
    return errorResponse("Este registro corresponde a un bloqueo y no puede cancelarse", 400);
  }

  // Validar coincidencia de teléfono estandarizado
  const isMatch = arePhonesEqual(phone, appt.phone);
  if (!isMatch) {
    return errorResponse("El número de teléfono no coincide con el registrado en el turno", 400);
  }

  if (action === "search") {
    return NextResponse.json({
      success: true,
      appointment: {
        id: appt.id,
        client: appt.client,
        phone: appt.phone,
        phoneFormatted: formatPhoneDisplay(appt.phone),
        date: appt.date,
        start_time: appt.start_time?.slice(0, 5) ?? appt.start_time,
        end_time: appt.end_time?.slice(0, 5) ?? appt.end_time,
        barbers: appt.barbers ? { name: appt.barbers.name } : null,
        services: appt.services ? { name: appt.services.name } : null,
      },
    });
  }

  if (action === "confirm") {
    const now = new Date().toISOString();
    const deletedBy = `${appt.client || "Cliente"} (Online)`;

    const { error: deleteError } = await supabaseAdmin
      .from("appointments")
      .update({
        deleted_at: now,
        deleted_by: deletedBy,
      })
      .eq("id", numericId);

    if (deleteError) {
      console.error("Error cancelando turno:", deleteError);
      return errorResponse("No se pudo cancelar el turno. Comunícate con el local.", 500);
    }

    revalidateTag("appointments");
    if (appt.barber_id && appt.date) {
      revalidateTag(`appointments-${appt.barber_id}-${appt.date}`);
    }

    return NextResponse.json({
      success: true,
      message: "Turno cancelado con éxito",
    });
  }

  return errorResponse("Acción desconocida", 400);
}
