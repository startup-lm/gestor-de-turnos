import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSettingsForm } from "@/lib/hooks/useSettingsForm";
import * as repo from "@/lib/repository/businessSettings";
import * as toastStore from "@/lib/store/useToastStore";

const mockRefreshConfig = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/context/BusinessContext", () => ({
  useBusinessContext: () => ({
    refreshConfig: mockRefreshConfig,
  }),
}));

describe("useSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(toastStore.toast, "success").mockImplementation(() => {});
    vi.spyOn(toastStore.toast, "error").mockImplementation(() => {});
  });

  it("carga la configuración inicial usando pick", async () => {
    vi.spyOn(repo, "getBusinessSettings").mockResolvedValue({
      slot_step_minutes: 30,
      business_name: "Barber Shop",
    });

    const { result } = renderHook(() =>
      useSettingsForm({
        pick: (s) => ({ name: s.business_name || "" }),
        toPayload: (draft) => ({ business_name: draft.name }),
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.draft).toBeNull();

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.draft).toEqual({ name: "Barber Shop" });
    expect(result.current.hasChanges).toBe(false);
  });

  it("detecta hasChanges y permite reset()", async () => {
    vi.spyOn(repo, "getBusinessSettings").mockResolvedValue({
      slot_step_minutes: 30,
      business_name: "Original",
    });

    const { result } = renderHook(() =>
      useSettingsForm({
        pick: (s) => ({ name: s.business_name || "" }),
        toPayload: (draft) => ({ business_name: draft.name }),
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      result.current.setDraft({ name: "Modificado" });
    });

    expect(result.current.hasChanges).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.draft).toEqual({ name: "Original" });
    expect(result.current.hasChanges).toBe(false);
  });

  it("guarda correctamente y actualiza el estado inicial", async () => {
    vi.spyOn(repo, "getBusinessSettings").mockResolvedValue({
      slot_step_minutes: 30,
      business_name: "Original",
    });
    vi.spyOn(repo, "updateBusinessSettings").mockResolvedValue({
      slot_step_minutes: 30,
      business_name: "Nuevo Nombre",
    });

    const { result } = renderHook(() =>
      useSettingsForm({
        pick: (s) => ({ name: s.business_name || "" }),
        toPayload: (draft) => ({ business_name: draft.name }),
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setDraft({ name: "Nuevo Nombre" });
    });

    let ok = false;
    await act(async () => {
      ok = await result.current.save();
    });

    expect(ok).toBe(true);
    expect(result.current.hasChanges).toBe(false);
    expect(toastStore.toast.success).toHaveBeenCalledWith("Cambios guardados");
    expect(mockRefreshConfig).toHaveBeenCalled();
  });

  it("maneja errores de guardado mostrando toast.error", async () => {
    vi.spyOn(repo, "getBusinessSettings").mockResolvedValue({
      slot_step_minutes: 30,
      business_name: "Original",
    });
    vi.spyOn(repo, "updateBusinessSettings").mockRejectedValue(
      new Error("Límite alcanzado")
    );

    const { result } = renderHook(() =>
      useSettingsForm({
        pick: (s) => ({ name: s.business_name || "" }),
        toPayload: (draft) => ({ business_name: draft.name }),
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setDraft({ name: "Cambio" });
    });

    let ok = true;
    await act(async () => {
      ok = await result.current.save();
    });

    expect(ok).toBe(false);
    expect(toastStore.toast.error).toHaveBeenCalledWith("Límite alcanzado");
  });
});
