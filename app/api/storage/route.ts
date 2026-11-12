import { NextResponse } from "next/server";
import { errorResponse, successResponse, dbErrorResponse } from "@/lib/api/response";
import { parseBody } from "@/lib/api/parseBody";
import { StorageDeleteSchema } from "@/lib/schemas";
import { requireBarberOrAdmin } from "@/lib/api/auth";
import { removeStorageObject, uploadStorageObject } from "@/lib/storage/server";
import {
  canWriteBucket,
  isAllowedBucket,
  isAllowedImageType,
  isSafeObjectPath,
  MAX_UPLOAD_BYTES,
} from "@/lib/storage/policy";

export async function POST(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const formData = await request.formData();
  const bucket = formData.get("bucket") as string | null;
  const file = formData.get("file") as Blob | null;

  if (!bucket || !file) return errorResponse("Faltan bucket o file en el form-data", 400);
  if (!isAllowedBucket(bucket)) return errorResponse("Bucket inválido", 400);
  if (!canWriteBucket(bucket, staff.barber.role)) return errorResponse("No autorizado", 403);
  if (!isAllowedImageType(file.type)) return errorResponse("Solo se permiten imágenes JPG, PNG, WEBP o GIF", 400);
  if (file.size > MAX_UPLOAD_BYTES) return errorResponse("La imagen supera el tamaño máximo de 5 MB", 400);

  const ext = file.type.split("/")[1] ?? "bin";
  const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { publicUrl, error } = await uploadStorageObject(bucket, fileName, file);
  if (error) return dbErrorResponse(error, "storage.upload");

  return NextResponse.json({ publicUrl });
}

export async function DELETE(request: Request) {
  const staff = await requireBarberOrAdmin();
  if (!staff) return errorResponse("No autorizado", 401);

  const { data: body, error: bodyError } = await parseBody(request, StorageDeleteSchema);
  if (bodyError) return bodyError;

  const { bucket, path } = body;
  if (!isAllowedBucket(bucket) || !isSafeObjectPath(path)) return errorResponse("Parámetros inválidos", 400);
  if (!canWriteBucket(bucket, staff.barber.role)) return errorResponse("No autorizado", 403);

  const { error } = await removeStorageObject(bucket, path);
  if (error) return dbErrorResponse(error, "storage.remove");
  return successResponse();
}
