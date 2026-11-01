/**
 * Reglas de acceso al almacenamiento de imágenes.
 * Funciones puras (sin Supabase) para poder reutilizarlas si se migra a otro storage.
 */

export const ALLOWED_BUCKETS = ["barbers", "branding", "local_photos", "products", "services"] as const;
export type StorageBucket = (typeof ALLOWED_BUCKETS)[number];

/** Buckets que un barbero (no admin) puede modificar: solo su foto de perfil. */
const BARBER_WRITABLE_BUCKETS: readonly StorageBucket[] = ["barbers"];

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

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

/** Solo nombres de archivo planos: evita borrar objetos fuera de la raíz del bucket. */
export function isSafeObjectPath(path: unknown): path is string {
  return typeof path === "string" && /^[A-Za-z0-9._-]+$/.test(path) && !path.includes("..");
}
