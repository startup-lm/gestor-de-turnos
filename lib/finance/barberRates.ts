import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

/** % de comisión vigentes de un barbero, para congelarlos al cobrar un turno o registrar una venta */
export async function getBarberRates(barberId: number) {
  const { data, error } = await supabaseAdmin
    .from("barbers")
    .select("commission, sale_commission")
    .eq("id", barberId)
    .maybeSingle();
  return {
    rates: data
      ? { commission: Number(data.commission ?? 0), saleCommission: Number(data.sale_commission ?? 0) }
      : null,
    error,
  };
}

/** % vigentes de todos los barberos: respaldo para lo cobrado antes de que se guardara el % */
export async function getAllBarberRates() {
  const { data, error } = await supabaseAdmin.from("barbers").select("id, commission, sale_commission");
  const rates = new Map<number, { commission: number; saleCommission: number }>();
  (data ?? []).forEach((b) =>
    rates.set(b.id, { commission: Number(b.commission ?? 0), saleCommission: Number(b.sale_commission ?? 0) })
  );
  return { rates, error };
}

/** Mensaje al intentar modificar algo cuya comisión ya se pagó */
export function lockedByPayoutMessage(kind: "turno" | "venta", payoutId: number) {
  const subject = kind === "turno" ? "Este turno ya está" : "Esta venta ya está";
  return `${subject} en la liquidación #${payoutId}. Anulala para modificarlo.`;
}
