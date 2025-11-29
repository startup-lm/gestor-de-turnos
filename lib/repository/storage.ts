const BASE = process.env.NEXT_PUBLIC_APP_URL!

export async function uploadImage(bucket: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("bucket", bucket);
  form.append("file", file);

  const res = await fetch(`${BASE}/api/storage`, {
    method: "POST",
    body: form,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al subir imagen");
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

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Error al eliminar imagen");
}
