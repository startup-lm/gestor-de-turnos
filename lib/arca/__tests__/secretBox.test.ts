import { describe, it, expect } from "vitest";
import {
  ENCRYPTED_PREFIX,
  isEncrypted,
  encryptSecret,
  decryptSecret,
} from "@/lib/arca/secretBox";
import { ArcaError } from "@/lib/arca/soap";

describe("secretBox", () => {
  const secret = "test-encryption-key-for-unit-tests-only";
  const dummyPem = "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----";

  it("isEncrypted detecta correctamente el prefijo", () => {
    expect(isEncrypted(`${ENCRYPTED_PREFIX}payload`)).toBe(true);
    expect(isEncrypted("plain-text-key")).toBe(false);
    expect(isEncrypted("enc:v2:other")).toBe(false);
    expect(isEncrypted(null)).toBe(false);
    expect(isEncrypted(undefined)).toBe(false);
    expect(isEncrypted("")).toBe(false);
  });

  it("ida y vuelta: cifra y descifra preservando el texto original", () => {
    const encrypted = encryptSecret(dummyPem, secret);
    expect(isEncrypted(encrypted)).toBe(true);
    const decrypted = decryptSecret(encrypted, secret);
    expect(decrypted).toBe(dummyPem);
  });

  it("dos cifrados del mismo texto dan resultados distintos debido al IV aleatorio", () => {
    const enc1 = encryptSecret(dummyPem, secret);
    const enc2 = encryptSecret(dummyPem, secret);
    expect(enc1).not.toBe(enc2);
    expect(decryptSecret(enc1, secret)).toBe(dummyPem);
    expect(decryptSecret(enc2, secret)).toBe(dummyPem);
  });

  it("texto plano pasa sin cambios en decryptSecret", () => {
    expect(decryptSecret("clave_sin_cifrar", secret)).toBe("clave_sin_cifrar");
    expect(decryptSecret(dummyPem, secret)).toBe(dummyPem);
    expect(decryptSecret("", secret)).toBe("");
  });

  it("sin secret no cifra: devuelve plain tal cual", () => {
    expect(encryptSecret(dummyPem, undefined)).toBe(dummyPem);
    expect(encryptSecret(dummyPem, "")).toBe(dummyPem);
  });

  it("prefijo sin secret lanza ArcaError('Falta configurar ARCA_ENCRYPTION_KEY...')", () => {
    const encrypted = encryptSecret(dummyPem, secret);

    expect(() => decryptSecret(encrypted, undefined)).toThrow(ArcaError);
    expect(() => decryptSecret(encrypted, undefined)).toThrow(
      "Falta configurar ARCA_ENCRYPTION_KEY para leer la clave de ARCA"
    );

    try {
      decryptSecret(encrypted, undefined);
    } catch (err) {
      expect(err).toBeInstanceOf(ArcaError);
      expect((err as ArcaError).kind).toBe("auth");
    }

    expect(() => decryptSecret(encrypted, "")).toThrow(
      "Falta configurar ARCA_ENCRYPTION_KEY para leer la clave de ARCA"
    );
  });

  it("secret incorrecto lanza ArcaError('No se pudo leer la clave de ARCA guardada...')", () => {
    const encrypted = encryptSecret(dummyPem, secret);
    const wrongSecret = "wrong-password-123456789";

    expect(() => decryptSecret(encrypted, wrongSecret)).toThrow(ArcaError);
    expect(() => decryptSecret(encrypted, wrongSecret)).toThrow(
      "No se pudo leer la clave de ARCA guardada. Volvé a cargarla"
    );

    try {
      decryptSecret(encrypted, wrongSecret);
    } catch (err) {
      expect(err).toBeInstanceOf(ArcaError);
      expect((err as ArcaError).kind).toBe("auth");
    }
  });

  it("dato corrupto lanza ArcaError('No se pudo leer la clave de ARCA guardada...')", () => {
    const corruptValues = [
      `${ENCRYPTED_PREFIX}short`,
      `${ENCRYPTED_PREFIX}bm90LWVub3VnaC1ieXRlcw==`,
      `${ENCRYPTED_PREFIX}!!!not-base64???`,
    ];

    for (const val of corruptValues) {
      expect(() => decryptSecret(val, secret)).toThrow(ArcaError);
      expect(() => decryptSecret(val, secret)).toThrow(
        "No se pudo leer la clave de ARCA guardada. Volvé a cargarla"
      );
    }
  });
});
