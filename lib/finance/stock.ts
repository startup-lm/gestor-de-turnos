import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";
import { errorResponse, dbErrorResponse } from "@/lib/api/response";

/** Intentos si otra venta cambió el stock entre la lectura y la escritura */
const MAX_ATTEMPTS = 3;

export type StockAdjustment =
  | { ok: true; stock: number }
  | { ok: false; reason: "insufficient"; stock: number }
  | { ok: false; reason: "not_found" | "conflict" }
  | { ok: false; reason: "error"; error: unknown };

/**
 * Suma (delta > 0) o descuenta (delta < 0) unidades del stock de un producto.
 * Solo escribe si el stock sigue siendo el que se leyó: así dos ventas
 * simultáneas no pueden llevarse la misma última unidad. Nunca deja stock negativo.
 */
export async function adjustProductStock(productId: number, delta: number): Promise<StockAdjustment> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { data: product, error: readError } = await supabaseAdmin
      .from("products")
      .select("stock")
      .eq("id", productId)
      .maybeSingle();
    if (readError) return { ok: false, reason: "error", error: readError };
    if (!product) return { ok: false, reason: "not_found" };

    const current = Number(product.stock ?? 0);
    const next = current + delta;
    if (next < 0) return { ok: false, reason: "insufficient", stock: current };
    if (delta === 0) return { ok: true, stock: current };

    const { data: updated, error: writeError } = await supabaseAdmin
      .from("products")
      .update({ stock: next })
      .eq("id", productId)
      .eq("stock", current)
      .select("id");
    if (writeError) return { ok: false, reason: "error", error: writeError };
    if (updated && updated.length > 0) return { ok: true, stock: next };
  }
  return { ok: false, reason: "conflict" };
}

/** Mensaje para quien intenta vender más unidades de las que hay */
export function insufficientStockMessage(available: number) {
  return available === 0
    ? "Este producto no tiene stock"
    : `No hay stock suficiente de este producto (quedan ${available})`;
}

/** Mensaje cuando varias ventas tocaron el mismo producto a la vez y no se pudo confirmar */
export const STOCK_CONFLICT_MESSAGE = "El stock cambió mientras se guardaba. Probá de nuevo.";

/** Respuesta de la API para un ajuste de stock que no se pudo hacer */
export function stockFailureResponse(failure: Exclude<StockAdjustment, { ok: true }>, context: string) {
  switch (failure.reason) {
    case "insufficient":
      return errorResponse(insufficientStockMessage(failure.stock), 409);
    case "not_found":
      return errorResponse("Producto no encontrado", 404);
    case "conflict":
      return errorResponse(STOCK_CONFLICT_MESSAGE, 409);
    default:
      return dbErrorResponse(failure.error, context);
  }
}
