import { NextResponse } from "next/server";

import { errorResponse, successResponse } from "@/lib/api/response";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

export async function POST(request: Request) {
  const formData = await request.formData();
  const bucket = formData.get("bucket") as string | null;
  const file = formData.get("file") as Blob | null;
  if (!bucket || !file) return errorResponse("Faltan bucket o file en el form-data", 400);
  const ext = file instanceof File ? file.name.split(".").pop() : "bin";
  const fileName = `${Date.now()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(fileName, file, { upsert: true });
  if (uploadError) {
    return errorResponse(uploadError.message);
  }
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(fileName);
  return NextResponse.json({ publicUrl: urlData.publicUrl });
}

export async function DELETE(request: Request) {
  const { bucket, path } = await request.json();
  if (!bucket || !path) {
    return errorResponse("Faltan bucket o path en el body", 400);
  }
  const { error: deleteError } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path]);
  if (deleteError) return errorResponse(deleteError.message);
  return successResponse();
}