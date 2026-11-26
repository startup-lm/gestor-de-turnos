/**
 * Reglas de acceso al almacenamiento de imágenes.
 * Funciones puras (sin Supabase) para poder reutilizarlas si se migra a otro storage.
 */

export const ALLOWED_BUCKETS = ["barbers", "branding", "local_photos", "products", "services"] as const;
export type StorageBucket = (typeof ALLOWED_BUCKETS)[number];

/** Buckets que un barbero (no admin) puede modificar: solo su foto de perfil. */
const BARBER_WRITABLE_BUCKETS: readonly StorageBucket[] = ["barbers"];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const IMAGE_ACCEPT_ATTR = "image/jpeg,image/png,image/webp,image/gif";
export const IMAGE_LIMITS_TEXT = "JPG, PNG, WEBP o GIF, hasta 4 MB";

export function isAllowedBucket(bucket: unknown): bucket is StorageBucket {
  return typeof bucket === "string" && (ALLOWED_BUCKETS as readonly string[]).includes(bucket);
}

export function canWriteBucket(bucket: StorageBucket, role: string): boolean {
  if (role === "admin") return true;
  return BARBER_WRITABLE_BUCKETS.includes(bucket);
}

export function isAllowedImageType(mimeType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mimeType);
}

/** Devuelve el mensaje para el usuario si el archivo no se puede subir, o null si es válido. */
export function validateImageFile(file: { type: string; size: number }): string | null {
  if (!isAllowedImageType(file.type)) {
    return "Formato no permitido. Subí una imagen JPG, PNG, WEBP o GIF.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `La imagen pesa ${(file.size / (1024 * 1024)).toFixed(1)} MB y el máximo es 4 MB. Reducila o elegí otra.`;
  }
  return null;
}

/** Solo nombres de archivo planos: evita borrar objetos fuera de la raíz del bucket. */
export function isSafeObjectPath(path: unknown): path is string {
  return typeof path === "string" && /^[A-Za-z0-9._-]+$/.test(path) && !path.includes("..");
}
