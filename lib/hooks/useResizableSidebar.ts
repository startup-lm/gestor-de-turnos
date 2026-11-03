"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

/** Ancho por defecto: entra el ítem más largo del menú ("Configuración ARCA") con algo de aire */
export const SIDEBAR_DEFAULT_WIDTH = 220;
export const SIDEBAR_MIN_WIDTH = 180;
export const SIDEBAR_MAX_WIDTH = 360;
/** Ancho del menú colapsado (solo íconos), igual a `lg:w-16` */
export const SIDEBAR_COLLAPSED_WIDTH = 64;
/** Arrastrando por debajo de este ancho el menú se colapsa, como en VS Code */
export const SIDEBAR_COLLAPSE_THRESHOLD = 120;

const STORAGE_KEY = "admin-sidebar-width";
const KEYBOARD_STEP = 16;

export function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

/** Traduce el ancho pedido por el arrastre en el estado del menú: colapsado o con un ancho válido */
export function resolveDraggedWidth(rawWidth: number): { collapsed: boolean; width: number | null } {
  if (rawWidth < SIDEBAR_COLLAPSE_THRESHOLD) return { collapsed: true, width: null };
  return { collapsed: false, width: clampSidebarWidth(rawWidth) };
}

function readStoredWidth(): number | null {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? clampSidebarWidth(stored) : null;
  } catch {
    return null;
  }
}

function storeWidth(width: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(width));
  } catch {
    // Sin localStorage (modo privado, bloqueado): el ancho dura solo esta visita
  }
}

/** Ancho ajustable del menú lateral de /admin: arrastre del borde, teclado, doble clic y colapso */
export function useResizableSidebar() {
  const [width, setWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; width: number } | null>(null);
  const widthRef = useRef(width);
  widthRef.current = width;

  // Se lee después de montar para que el HTML del servidor y el del cliente coincidan
  useEffect(() => {
    const stored = readStoredWidth();
    if (stored !== null) setWidth(stored);
  }, []);

  const toggleCollapsed = useCallback(() => setIsCollapsed((prev) => !prev), []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // Evita que el arrastre seleccione texto de la página
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : width };
    setIsDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current) return;
    const next = resolveDraggedWidth(dragStart.current.width + e.clientX - dragStart.current.x);
    setIsCollapsed(next.collapsed);
    if (next.width !== null) setWidth(next.width);
  };

  const endDrag = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setIsDragging(false);
    storeWidth(widthRef.current);
  };

  const onDoubleClick = () => {
    setIsCollapsed(false);
    setWidth(SIDEBAR_DEFAULT_WIDTH);
    storeWidth(SIDEBAR_DEFAULT_WIDTH);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (isCollapsed) return;
      // Ya en el mínimo, una flecha más colapsa el menú
      if (width <= SIDEBAR_MIN_WIDTH) {
        setIsCollapsed(true);
        return;
      }
      const next = clampSidebarWidth(width - KEYBOARD_STEP);
      setWidth(next);
      storeWidth(next);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (isCollapsed) {
        setIsCollapsed(false);
        return;
      }
      const next = clampSidebarWidth(width + KEYBOARD_STEP);
      setWidth(next);
      storeWidth(next);
    }
  };

  return {
    width,
    isCollapsed,
    isDragging,
    toggleCollapsed,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onDoubleClick,
      onKeyDown,
    },
  };
}
