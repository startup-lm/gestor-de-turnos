import { getBaseUrl } from "@/utils/getBaseUrl";
import { validateImageFile } from "@/lib/storage/policy";

const BASE = getBaseUrl();

export async function uploadImage(bucket: string, file: File): Promise<string> {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);

  const form = new FormData();
  form.append("bucket", bucket);
  form.append("file", file);

  const res = await fetch(`${BASE}/api/storage`, {
    method: "POST",
    body: form,
  });

  if (res.status === 413) {
    throw new Error("La imagen es demasiado pesada. El máximo es 4 MB.");
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "No se pudo subir la imagen. Probá de nuevo.");
  if (!json?.publicUrl) throw new Error("No se pudo subir la imagen. Probá de nuevo.");
  return json.publicUrl as string;
}

export async function deleteImage(bucket: string, imageUrl: string | null) {
  if (!imageUrl) return;
  const path = imageUrl.split("/").pop()!;
  const res = await fetch(`${BASE}/api/storage`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, path }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.error || "Error al eliminar imagen");
}
