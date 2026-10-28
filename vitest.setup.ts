import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock global de revalidateTag y revalidatePath de next/cache
vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// Mock global de cookies() en next/headers para Route Handlers
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => ({ name, value: "mock-cookie-val" })),
    getAll: vi.fn(() => []),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// Mock global de navegación de Next.js
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  usePathname: vi.fn(() => "/"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
