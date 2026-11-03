import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { KeyboardEvent, PointerEvent } from "react";
import {
  useResizableSidebar,
  resolveDraggedWidth,
  clampSidebarWidth,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
} from "@/lib/hooks/useResizableSidebar";

const STORAGE_KEY = "admin-sidebar-width";

function pointer(clientX: number) {
  return {
    button: 0,
    clientX,
    pointerId: 1,
    preventDefault: () => {},
    currentTarget: { setPointerCapture: () => {} },
  } as unknown as PointerEvent<HTMLDivElement>;
}

function key(name: string) {
  return { key: name, preventDefault: () => {} } as unknown as KeyboardEvent<HTMLDivElement>;
}

describe("resolveDraggedWidth", () => {
  it("colapsa el menú por debajo del umbral", () => {
    expect(resolveDraggedWidth(100)).toEqual({ collapsed: true, width: null });
  });

  it("entre el umbral y el mínimo queda en el mínimo", () => {
    expect(resolveDraggedWidth(150)).toEqual({ collapsed: false, width: SIDEBAR_MIN_WIDTH });
  });

  it("respeta el máximo", () => {
    expect(clampSidebarWidth(900)).toBe(SIDEBAR_MAX_WIDTH);
  });
});

describe("useResizableSidebar", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("arranca en el ancho por defecto", () => {
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH);
    expect(result.current.isCollapsed).toBe(false);
  });

  it("recupera el ancho guardado, acotado al rango válido", () => {
    window.localStorage.setItem(STORAGE_KEY, "9999");
    const { result } = renderHook(() => useResizableSidebar());
    expect(result.current.width).toBe(SIDEBAR_MAX_WIDTH);
  });

  it("arrastrar ensancha el menú y guarda el ancho al soltar", () => {
    const { result } = renderHook(() => useResizableSidebar());

    act(() => result.current.handleProps.onPointerDown(pointer(220)));
    act(() => result.current.handleProps.onPointerMove(pointer(300)));
    expect(result.current.isDragging).toBe(true);
    expect(result.current.width).toBe(300);

    act(() => result.current.handleProps.onPointerUp());
    expect(result.current.isDragging).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("300");
  });

  it("arrastrar por debajo del umbral colapsa, y volver a arrastrar lo expande", () => {
    const { result } = renderHook(() => useResizableSidebar());

    act(() => result.current.handleProps.onPointerDown(pointer(220)));
    act(() => result.current.handleProps.onPointerMove(pointer(50)));
    expect(result.current.isCollapsed).toBe(true);
    // El ancho anterior se conserva para cuando se vuelva a expandir
    expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH);

    act(() => result.current.handleProps.onPointerMove(pointer(250)));
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.width).toBe(250);
  });

  it("doble clic restablece el ancho por defecto", () => {
    window.localStorage.setItem(STORAGE_KEY, "320");
    const { result } = renderHook(() => useResizableSidebar());

    act(() => result.current.handleProps.onDoubleClick());
    expect(result.current.width).toBe(SIDEBAR_DEFAULT_WIDTH);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(String(SIDEBAR_DEFAULT_WIDTH));
  });

  it("con el teclado, una flecha a la izquierda en el mínimo colapsa el menú", () => {
    window.localStorage.setItem(STORAGE_KEY, String(SIDEBAR_MIN_WIDTH));
    const { result } = renderHook(() => useResizableSidebar());

    act(() => result.current.handleProps.onKeyDown(key("ArrowLeft")));
    expect(result.current.isCollapsed).toBe(true);

    act(() => result.current.handleProps.onKeyDown(key("ArrowRight")));
    expect(result.current.isCollapsed).toBe(false);
    expect(result.current.width).toBe(SIDEBAR_MIN_WIDTH);
  });
});
