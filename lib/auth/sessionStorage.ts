/* eslint-disable @typescript-eslint/no-explicit-any */
export interface StoredAuth {
  user: any;
  role: string;
  barberId: number;
}

const STORAGE_KEY = "auth";

export function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function saveStoredAuth(data: StoredAuth) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { }
}

export function clearStoredAuth() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { }
}
