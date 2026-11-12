"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Star,
  RefreshCw,
  MapPin,
  Check,
  CheckCircle2,
  Search,
  Loader2,
} from "lucide-react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import SaveButton from "@/components/buttons/SaveButton";
import { toast } from "@/lib/store/useToastStore";
import type {
  GoogleReviewItem,
  GoogleReviewsConfig,
} from "@/lib/types/BusinessSettings";
import type { GooglePlaceCandidate } from "@/lib/services/googlePlaces";

export default function ConfigResenasSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Datos del comercio
  const [businessName, setBusinessName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  // Detección automática de candidato
  const [candidate, setCandidate] = useState<GooglePlaceCandidate | null>(null);
  const [searchingCandidate, setSearchingCandidate] = useState(false);
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);

  // Estados de configuración de reseñas
  const [enabled, setEnabled] = useState(true);
  const [locationInput, setLocationInput] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [userRatingsTotal, setUserRatingsTotal] = useState<number>(0);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<GoogleReviewItem[]>([]);

  // Estado inicial para comparar cambios
  const [initialConfig, setInitialConfig] = useState<GoogleReviewsConfig | null>(null);

  // Buscar candidato (automático o manual por búsqueda de texto/link)
  const fetchCandidate = useCallback(async (queryOverride?: string, notify?: boolean) => {
    try {
      setSearchingCandidate(true);
      const res = await fetch("/api/google-reviews/candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryOverride || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.candidate) {
          setCandidate(data.candidate);
          setIsManualSearchOpen(false);
          if (notify) {
            toast.success("Encontramos un local en Google Maps. Por favor verificalo abajo.");
          }
        } else {
          setCandidate(null);
          if (notify) {
            toast.error(`No encontramos un local en Google Maps para "${queryOverride}".`);
          }
        }
      }
    } catch (err) {
      console.warn("No se pudo detectar candidato de Google Places:", err);
      if (notify) {
        toast.error("Error al buscar el local en Google Maps.");
      }
    } finally {
      setSearchingCandidate(false);
    }
  }, []);

  const handleSearchCandidateManual = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = locationInput.trim();
    if (!query) {
      toast.error("Ingresá el nombre o link de Google Maps de tu local.");
      return;
    }
    fetchCandidate(query, true);
  };

  // Cargar configuración existente
  useEffect(() => {
    async function loadConfig() {
      try {
        setLoading(true);
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          const name = data.business_name ?? "";
          const addr = data.location_address ?? "";
          setBusinessName(name);
          setLocationAddress(addr);

          const cfg: GoogleReviewsConfig = data.google_reviews || {};
          const currentPlaceId = cfg.place_id ?? "";
          setEnabled(cfg.enabled ?? true);
          setPlaceId(currentPlaceId);
          setLocationInput(currentPlaceId);
          const savedHidden = Array.isArray(cfg.hidden_review_ids) ? cfg.hidden_review_ids : [];
          setHiddenReviewIds(savedHidden);
          setInitialConfig(JSON.parse(JSON.stringify(cfg)));

          // Si ya vinculó su local, pedir vista previa en vivo
          if (currentPlaceId) {
            fetchPreview(currentPlaceId);
          } else if (name || addr) {
            fetchCandidate(`${name} ${addr}`.trim());
          }
        }
      } catch (err) {
        console.error("Error al cargar configuración de reseñas:", err);
        toast.error("Error al cargar configuración de reseñas");
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCandidate]);

  // Obtener vista previa sin guardar en base de datos
  const fetchPreview = async (targetId?: string) => {
    const idToFetch = (targetId || placeId || locationInput).trim();
    if (!idToFetch) return;

    setSyncing(true);
    try {
      const res = await fetch("/api/google-reviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: idToFetch }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.rating !== undefined) setRating(data.rating);
        if (data.total !== undefined) setUserRatingsTotal(data.total);
        if (Array.isArray(data.reviews)) setReviews(data.reviews);
          if (data.place_id) setPlaceId(data.place_id);
      }
    } catch (err) {
      console.error("Error al obtener vista previa de Google Places:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Detectar cambios sin guardar
  const hasChanges = useMemo(() => {
    if (!initialConfig) return false;
    const initialHidden = initialConfig.hidden_review_ids ?? [];
    const isHiddenEqual =
      hiddenReviewIds.length === initialHidden.length &&
      hiddenReviewIds.every((id) => initialHidden.includes(id));

    return (
      enabled !== (initialConfig.enabled ?? true) ||
      placeId.trim() !== (initialConfig.place_id ?? "") ||
      !isHiddenEqual
    );
  }, [
    enabled,
    placeId,
    hiddenReviewIds,
    initialConfig,
  ]);

  // Confirmar y vincular el candidato detectado
  const handleConfirmCandidate = async (targetPlaceId: string) => {
    setSyncing(true);
    try {
      const res = await fetch("/api/google-reviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: targetPlaceId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en la sincronización.");
      }

      setPlaceId(data.place_id || targetPlaceId);
      setLocationInput(data.place_id || targetPlaceId);
      if (data.rating !== undefined) setRating(data.rating);
      if (data.total !== undefined) setUserRatingsTotal(data.total);
      if (Array.isArray(data.reviews)) setReviews(data.reviews);
      setCandidate(null);
      setIsManualSearchOpen(false);
      toast.success("Local confirmado y reseñas actualizadas");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error al vincular el local.";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  // Actualizar vista previa manual
  const handleUpdatePreview = async () => {
    const targetInput = locationInput.trim() || placeId.trim();
    if (!targetInput) {
      toast.error("Pegá el link de Google Maps o el nombre de tu local para sincronizar.");
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch("/api/google-reviews/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: targetInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en la sincronización.");
      }

      if (data.place_id) setPlaceId(data.place_id);
      if (data.rating !== undefined) setRating(data.rating);
      if (data.total !== undefined) setUserRatingsTotal(data.total);
      if (Array.isArray(data.reviews)) setReviews(data.reviews);
      setIsManualSearchOpen(false);
      setCandidate(null);
      toast.success("Reseñas actualizadas con éxito");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Error al sincronizar con Google Places.";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  // Guardar configuración general
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    // Se parte de la config guardada para no perder campos que no se editan acá
    const payloadConfig: GoogleReviewsConfig = {
      ...initialConfig,
      enabled,
      place_id: placeId.trim() || locationInput.trim(),
      hidden_review_ids: hiddenReviewIds,
    };

    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          google_reviews: payloadConfig,
        }),
      });

      if (res.ok) {
        setInitialConfig(JSON.parse(JSON.stringify(payloadConfig)));
        toast.success("Configuración de reseñas guardada correctamente");
      } else {
        toast.error("Error al guardar la configuración");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión al guardar");
    } finally {
      setSaving(false);
    }
  };

  // Alternar visibilidad de una reseña individual en el sitio
  const toggleHideReview = (id: string) => {
    setHiddenReviewIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <ConfigFormSkeleton />;
  }

  return (
    <div className="space-y-8 w-full pb-16">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Reseñas de Google
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Conectá la ficha de Google Maps de tu local para mostrar tu calificación y opiniones reales en tu web.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SaveButton
            onClick={() => handleSave()}
            loading={saving}
            disabled={saving || !hasChanges}
          />
        </div>
      </div>

      {/* Switch Maestro Superior */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <label htmlFor="master-reviews-toggle" className="text-sm font-semibold text-white block cursor-pointer">
            Mostrar reseñas en el sitio web
          </label>
          <p className="text-xs text-slate-400">
            Habilita o pausa temporalmente la visualización de opiniones en la web sin borrar los datos guardados.
          </p>
        </div>

        <label
          htmlFor="master-reviews-toggle"
          className="relative inline-flex items-center cursor-pointer select-none"
        >
          <input
            id="master-reviews-toggle"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
        </label>
      </div>

      {/* Bloque 1: Vinculación del Comercio */}
      <div className="space-y-4">
        {/* Caso A: Tarjeta inteligente de confirmación ("¿Es este tu local?") */}
        {!placeId && candidate && !isManualSearchOpen && (
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 via-[var(--surface-deep)] to-slate-950 border border-[var(--accent)]/30 shadow-xl space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-bold tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Encontramos tu local en Google Maps</span>
              </div>
              <span className="text-[11px] text-slate-400">Coincidencia automática</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
                {candidate.name}
              </h2>
              {candidate.formatted_address && (
                <p className="text-xs sm:text-sm text-slate-300">
                  {candidate.formatted_address}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1.5">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= Math.round(candidate.rating || 0) ? "fill-amber-400" : "text-slate-800"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-white">
                  {candidate.rating ? candidate.rating.toFixed(1) : "Sin calificación"}
                </span>
                <span className="text-xs text-slate-400">
                  ({candidate.user_ratings_total || 0} opiniones en Google)
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleConfirmCandidate(candidate.place_id)}
                disabled={syncing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-[var(--accent)] hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[var(--accent)]/20 cursor-pointer disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Sí, confirmar y vincular este local</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualSearchOpen(true)}
                className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-center"
              >
                No es este / Buscar otro o pegar link
              </button>
            </div>
          </div>
        )}

        {/* Caso B: Local ya confirmado y vinculado */}
        {placeId && !isManualSearchOpen && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">Ficha de Google Maps vinculada</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Confirmado
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calificación actual: <strong className="text-white">{rating != null ? Number(rating).toFixed(1) : "—"} ⭐</strong> ({userRatingsTotal} opiniones sincronizadas)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleUpdatePreview}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-medium text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {syncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Actualizar reseñas</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualSearchOpen(true)}
                className="px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Cambiar local
              </button>
            </div>
          </div>
        )}

        {/* Caso C: Buscador manual o si eligió cambiar de local */}
        {(isManualSearchOpen || (!placeId && !candidate && !searchingCandidate)) && (
          <form
            onSubmit={handleSearchCandidateManual}
            className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-[var(--accent)]" />
                <span>Buscar o cambiar local en Google Maps</span>
              </h2>

              {placeId && (
                <button
                  type="button"
                  onClick={() => setIsManualSearchOpen(false)}
                  className="text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <label htmlFor="input-manual-location" className="text-xs font-semibold text-slate-300">
                  Nombre del local o link de Google Maps
                </label>

                {(businessName || locationAddress) && (
                  <button
                    type="button"
                    onClick={() => {
                      const query = `${businessName} ${locationAddress}`.trim();
                      setLocationInput(query);
                      fetchCandidate(query, true);
                    }}
                    className="text-[11px] text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>Reintentar con nombre y dirección</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="input-manual-location"
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Ej: 'Barbería Hooligans' o https://maps.app.goo.gl/..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                />

                <button
                  type="submit"
                  disabled={searchingCandidate || !locationInput.trim()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-[var(--accent)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[var(--accent)]/15 flex-shrink-0"
                >
                  {searchingCandidate ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Buscar local</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                Escribí el nombre de tu local o pegá el link directo de Google Maps (incluyendo links de compartir del celular). Al buscar, te mostraremos una tarjeta para que confirmes que es tu negocio antes de vincularlo.
              </p>
            </div>
          </form>
        )}

      </div>

      {/* Bloque 2: Métricas del local */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Calificación Promedio */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Puntuación promedio
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white">
                {rating != null ? Number(rating).toFixed(1) : "—"}
              </span>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      rating != null && s <= Math.round(Number(rating))
                        ? "fill-amber-400"
                        : "text-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-white/5">
            Son los datos reales de Google: no se pueden editar.
          </p>
        </div>

        {/* Total de Reseñas */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Total de opiniones
            </span>
            <span className="text-2xl font-bold text-white">
              {userRatingsTotal}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-white/5">
            Son los datos reales de Google: no se pueden editar.
          </p>
        </div>

      </div>

      {/* Bloque 3: Gestión y Moderación de Reseñas */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            Moderación de reseñas
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Google muestra como máximo 5 reseñas por lugar, elegidas por relevancia. Podés ocultar las que no quieras mostrar (por ejemplo, si son ofensivas).
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Las reseñas se actualizan solas una vez por día.
          </p>
        </div>

        {/* Lista de Reseñas */}
        {reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((rev) => {
              const isHidden = hiddenReviewIds.includes(rev.id);
              return (
                <div
                  key={rev.id}
                  className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isHidden
                      ? "bg-slate-950/30 border-white/5 opacity-50"
                      : "bg-slate-950/70 border-white/10 hover:border-[var(--accent)]/30"
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">
                        {rev.author_name}
                      </span>
                      <div className="flex items-center gap-0.5" aria-label={`${rev.rating} estrellas`}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                      {rev.relative_time && (
                        <span className="text-[11px] text-slate-400">
                          • {rev.relative_time}
                        </span>
                      )}
                      {isHidden && (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          Oculta
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      &ldquo;{rev.text}&rdquo;
                    </p>
                  </div>

                  {/* Switch Mostrar en el sitio */}
                  <div className="flex items-center gap-3 flex-shrink-0 self-end sm:self-auto">
                    <span className="text-xs text-slate-300 select-none">
                      Mostrar en el sitio
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleHideReview(rev.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]" />
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 px-4 border border-dashed border-white/10 rounded-xl space-y-2">
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              No hay opiniones para mostrar aún. Vinculá tu local y tocá &ldquo;Actualizar reseñas&rdquo;.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
