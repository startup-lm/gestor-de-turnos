import type { ZodType } from "zod";
import { errorResponse } from "@/lib/api/response";

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>
): Promise<{ data: T; error: null } | { data: null; error: Response }> {
  let raw: unknown;
  try {
    const text = await request.text();
    if (!text.trim()) {
      return { data: null, error: errorResponse("Datos inválidos", 400) };
    }
    raw = JSON.parse(text);
  } catch {
    return { data: null, error: errorResponse("Datos inválidos", 400) };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message || "Datos inválidos";
    return { data: null, error: errorResponse(message, 400) };
  }

  return { data: result.data, error: null };
}
