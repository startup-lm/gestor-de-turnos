import crypto from "node:crypto";
import { ArcaError } from "@/lib/arca/soap";

export const ENCRYPTED_PREFIX = "enc:v1:";

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(ENCRYPTED_PREFIX);
}

export function encryptSecret(
  plain: string,
  secret = process.env.ARCA_ENCRYPTION_KEY
): string {
  if (!secret) return plain;
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, ciphertext]).toString("base64");
  return `${ENCRYPTED_PREFIX}${payload}`;
}

export function decryptSecret(
  value: string,
  secret = process.env.ARCA_ENCRYPTION_KEY
): string {
  if (!isEncrypted(value)) return value;
  if (!secret) {
    throw new ArcaError(
      "Falta configurar ARCA_ENCRYPTION_KEY para leer la clave de ARCA",
      "auth"
    );
  }
  try {
    const raw = value.slice(ENCRYPTED_PREFIX.length);
    const buf = Buffer.from(raw, "base64");
    if (buf.length < 12 + 16) {
      throw new Error("Invalid payload length");
    }
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const key = crypto.createHash("sha256").update(secret).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch (err) {
    if (err instanceof ArcaError) throw err;
    throw new ArcaError(
      "No se pudo leer la clave de ARCA guardada. Volvé a cargarla",
      "auth"
    );
  }
}
