import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const { tags } = await req.json().catch(() => ({ tags: [] as string[] }));
  (tags ?? []).forEach((t: string) => revalidateTag(t));
  return NextResponse.json({ ok: true });
}