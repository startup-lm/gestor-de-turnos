import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

/**
 * Operaciones de storage del lado servidor.
 * Único punto acoplado al proveedor (hoy Supabase Storage): si se migra a un VPS
 * (disco local, S3, MinIO), solo cambia este archivo.
 */

export async function uploadStorageObject(bucket: string, fileName: string, file: Blob) {
  const { error } = await supabaseAdmin.storage.from(bucket).upload(fileName, file, { upsert: true });
  if (error) return { publicUrl: null, error };
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);
  return { publicUrl: data.publicUrl, error: null };
}

export async function removeStorageObject(bucket: string, path: string) {
  const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);
  return { error };
}

/** Borra la imagen a partir de su URL pública (usado al eliminar productos/servicios). */
export async function removeStorageObjectByUrl(bucket: string, imageUrl: string | null) {
  if (!imageUrl) return { error: null };
  const path = imageUrl.split("/").pop();
  if (!path) return { error: null };
  return removeStorageObject(bucket, path);
}
