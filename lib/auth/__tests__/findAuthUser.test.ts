/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { findAuthUserByEmail } from "../findAuthUser";
import { supabaseAdmin } from "@/lib/supabase/supabaseAdmin";

vi.mock("@/lib/supabase/supabaseAdmin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: vi.fn(),
      },
    },
  },
}));

describe("findAuthUserByEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve null si el email está vacío", async () => {
    const user = await findAuthUserByEmail("   ");
    expect(user).toBeNull();
    expect(supabaseAdmin.auth.admin.listUsers).not.toHaveBeenCalled();
  });

  it("encuentra un usuario en la primera página sin distinguir mayúsculas", async () => {
    const mockUsers = [
      { id: "u-1", email: "other@example.com" },
      { id: "u-2", email: "Test.User@example.com" },
    ];

    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValueOnce({
      data: { users: mockUsers as any },
      error: null,
    } as any);

    const user = await findAuthUserByEmail("test.user@example.com");
    expect(user).toEqual(mockUsers[1]);
    expect(supabaseAdmin.auth.admin.listUsers).toHaveBeenCalledWith({ page: 1, perPage: 200 });
  });

  it("recorre páginas sucesivas hasta encontrar el usuario", async () => {
    const page1Users = Array.from({ length: 200 }, (_, i) => ({
      id: `p1-${i}`,
      email: `user${i}@domain.com`,
    }));
    const page2Users = [
      { id: "target-id", email: "target@domain.com" },
    ];

    vi.mocked(supabaseAdmin.auth.admin.listUsers)
      .mockResolvedValueOnce({
        data: { users: page1Users as any },
        error: null,
      } as any)
      .mockResolvedValueOnce({
        data: { users: page2Users as any },
        error: null,
      } as any);

    const user = await findAuthUserByEmail("TARGET@domain.com");
    expect(user).toEqual(page2Users[0]);
    expect(supabaseAdmin.auth.admin.listUsers).toHaveBeenCalledTimes(2);
    expect(supabaseAdmin.auth.admin.listUsers).toHaveBeenNthCalledWith(1, { page: 1, perPage: 200 });
    expect(supabaseAdmin.auth.admin.listUsers).toHaveBeenNthCalledWith(2, { page: 2, perPage: 200 });
  });

  it("devuelve null cuando la página tiene menos de 200 usuarios y no se encuentra", async () => {
    const page1Users = [
      { id: "u-1", email: "a@domain.com" },
      { id: "u-2", email: "b@domain.com" },
    ];

    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValueOnce({
      data: { users: page1Users as any },
      error: null,
    } as any);

    const user = await findAuthUserByEmail("notfound@domain.com");
    expect(user).toBeNull();
    expect(supabaseAdmin.auth.admin.listUsers).toHaveBeenCalledTimes(1);
  });

  it("devuelve null si listUsers falla con error", async () => {
    vi.mocked(supabaseAdmin.auth.admin.listUsers).mockResolvedValueOnce({
      data: null,
      error: new Error("Auth service failure") as any,
    } as any);

    const user = await findAuthUserByEmail("user@domain.com");
    expect(user).toBeNull();
  });
});
