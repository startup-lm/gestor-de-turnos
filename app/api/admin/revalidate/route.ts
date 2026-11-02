import { errorResponse } from "@/lib/api/response";
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("No autorizado", 401);

  const { tags } = await req.json().catch(() => ({ tags: [] as string[] }));
  (tags ?? []).forEach((t: string) => revalidateTag(t));
  return NextResponse.json({ ok: true });
}