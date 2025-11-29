"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Barber } from "@/lib/types/Barbers";
import { slugify } from "@/utils/slug";

type Role = "guest" | "admin" | "barber" | string;

// Type guard: asegura { id: number }
function hasId(b: Barber): b is Barber & { id: number } {
  return typeof b.id === "number";
}

export function useSelectedBarber(
  initialBarbers: Barber[],
  role: Role,
  authBarberId: number
) {
  const [selectedBarberId, setSelectedBarberId] = useState<number>(-1);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Trabajar sólo con barberos que tienen id definido (narrowing)
  const barbersWithId = useMemo(
    () => initialBarbers.filter(hasId),
    [initialBarbers]
  );

  // Conjuntos/mapas seguros (id: number garantizado)
  const validIds = useMemo(
    () => new Set(barbersWithId.map((b) => b.id)),
    [barbersWithId]
  );

  const { slugToId, idToSlug } = useMemo(() => {
    const counts = new Map<string, number>();
    const s2i = new Map<string, number>();
    const i2s = new Map<number, string>();

    barbersWithId.forEach((b) => {
      const base = slugify(b.name || `barber-${b.id}`);
      const n = (counts.get(base) ?? 0) + 1;
      counts.set(base, n);
      const slug = n === 1 ? base : `${base}-${n}`;
      s2i.set(slug, b.id);
      i2s.set(b.id, slug);
    });

    return { slugToId: s2i, idToSlug: i2s };
  }, [barbersWithId]);

  const isValidBarber = useCallback(
    (id: number) => validIds.has(id),
    [validIds]
  );

  // Inicializar SOLO una vez (no pisar selección del usuario)
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;

    // 1) Prioriza slug (?barber=martin-acuna)
    const slug = searchParams.get("barber");
    if (slug && slugToId.has(slug)) {
      setSelectedBarberId(slugToId.get(slug)!);
      didInit.current = true;
      return;
    }

    // 2) Back-compat (?barberId=123)
    const fromId = Number(searchParams.get("barberId") ?? -1);
    if (!Number.isNaN(fromId) && fromId >= 0 && isValidBarber(fromId)) {
      setSelectedBarberId(fromId);
      didInit.current = true;
      return;
    }

    // 3) Fallback por role
    if (role === "guest") {
      setSelectedBarberId(barbersWithId.length === 1 ? barbersWithId[0].id : -1);
    } else {
      setSelectedBarberId(isValidBarber(authBarberId) ? authBarberId : -1);
    }

    didInit.current = true;
  }, [role, authBarberId, barbersWithId, searchParams, slugToId, isValidBarber]);

  // Cambiar selección y reflejar slug en la URL
  const setBarberId = useCallback(
    (id: number) => {
      const next = isValidBarber(id) ? id : -1;
      setSelectedBarberId(next);

      const params = new URLSearchParams(Array.from(searchParams.entries()));
      // limpiar params antiguos
      params.delete("barberId");

      if (next >= 0) {
        const slug = idToSlug.get(next) ?? `barber-${next}`;
        params.set("barber", slug);
      } else {
        params.delete("barber");
      }

      router.replace(
        `${pathname}${params.size ? `?${params.toString()}` : ""}`,
        { scroll: false }
      );
    },
    [idToSlug, isValidBarber, pathname, router, searchParams]
  );

  // selectedBarber (puede haber barberos sin id, por eso buscamos en initialBarbers)
  const selectedBarber = useMemo(
    () => initialBarbers.find((b) => b.id === selectedBarberId) ?? null,
    [initialBarbers, selectedBarberId]
  );

  return { selectedBarberId, selectedBarber, setBarberId };
}
