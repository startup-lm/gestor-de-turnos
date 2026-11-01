import { NextResponse } from "next/server";

export const GENERIC_ERROR_MESSAGE = "Ocurrió un error al procesar la solicitud. Intentá nuevamente.";

export function successResponse() {
  return NextResponse.json({ success: true });
}

export function errorResponse( message: string, status: number = 500 ) {
  return NextResponse.json( { error: message }, { status } );
}

/**
 * Respuesta para errores de base de datos o del proveedor.
 * Registra el detalle en el servidor (Sentry lo captura) y devuelve un mensaje genérico:
 * nunca se expone al usuario el mensaje crudo de Postgres.
 */
export function dbErrorResponse(error: unknown, context: string, status: number = 500) {
  console.error(`[api:${context}]`, error);
  return errorResponse(GENERIC_ERROR_MESSAGE, status);
}
