"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";
import SaveButton from "@/components/buttons/SaveButton";
import { useBusinessContext } from "@/lib/context/BusinessContext";
import { Palette, Undo, Check } from "lucide-react";

interface Props {
  onClose: () => void;
}

interface ColorPalette {
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemePreset {
  id: string;
  name: string;
  colors: ColorPalette;
}

const PRESETS: ThemePreset[] = [
  {
    id: "original",
    name: "Dorado Barbero (Original)",
    colors: {
      background: "#0F172A",
      foreground: "#F9FAFB",
      primary: "#111827",
      secondary: "#F3F4F6",
      accent: "#DFBA73",
    },
  },
  {
    id: "esmeralda",
    name: "Esmeralda Premium",
    colors: {
      background: "#022C22",
      foreground: "#F0FDF4",
      primary: "#064E3B",
      secondary: "#ECFDF5",
      accent: "#DFBA73",
    },
  },
  {
    id: "carbono",
    name: "Negro Carbono",
    colors: {
      background: "#09090B",
      foreground: "#FAFAFA",
      primary: "#18181B",
      secondary: "#F4F4F5",
      accent: "#E11D48",
    },
  },
  {
    id: "pizarra",
    name: "Modern Steel",
    colors: {
      background: "#0B0F19",
      foreground: "#F8FAFC",
      primary: "#1E293B",
      secondary: "#E2E8F0",
      accent: "#2563EB",
    },
  },
  {
    id: "nordico",
    name: "Nórdico Claro",
    colors: {
      background: "#F8FAFC",
      foreground: "#0F172A",
      primary: "#FFFFFF",
      secondary: "#E2E8F0",
      accent: "#0F172A",
    },
  },
];

// Helper to determine readable text color (black or white) based on background hex
function getContrastColor(hexColor: string) {
  if (!hexColor || !hexColor.startsWith("#")) return "#FFFFFF";
  let hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return "#FFFFFF";

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Relative luminance calculation
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

export default function ThemeSettingsModal({ onClose }: Readonly<Props>) {
  const { businessSettings, refreshConfig } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const popup = usePopup();

  // Color states
  const [colors, setColors] = useState<ColorPalette>({
    background: "#0F172A",
    foreground: "#F9FAFB",
    primary: "#111827",
    secondary: "#F3F4F6",
    accent: "#DFBA73",
  });

  // Original state loaded from DB
  const [originalColors, setOriginalColors] = useState<ColorPalette | null>(null);

  // Active preset ID if match
  const [activePresetId, setActivePresetId] = useState<string>("original");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          // Fallback to original preset if database theme_colors is empty
          const dbColors = data.theme_colors || PRESETS[0].colors;
          const currentPalette: ColorPalette = {
            background: dbColors.background || PRESETS[0].colors.background,
            foreground: dbColors.foreground || PRESETS[0].colors.foreground,
            primary: dbColors.primary || PRESETS[0].colors.primary,
            secondary: dbColors.secondary || PRESETS[0].colors.secondary,
            accent: dbColors.accent || PRESETS[0].colors.accent,
          };
          setColors(currentPalette);
          setOriginalColors(currentPalette);

          // Find if current match any preset
          const matchedPreset = PRESETS.find(
            (p) =>
              p.colors.background.toLowerCase() === currentPalette.background.toLowerCase() &&
              p.colors.foreground.toLowerCase() === currentPalette.foreground.toLowerCase() &&
              p.colors.primary.toLowerCase() === currentPalette.primary.toLowerCase() &&
              p.colors.secondary.toLowerCase() === currentPalette.secondary.toLowerCase() &&
              p.colors.accent.toLowerCase() === currentPalette.accent.toLowerCase()
          );
          setActivePresetId(matchedPreset ? matchedPreset.id : "custom");
        }
      } catch (err) {
        console.error("Error cargando configuración de colores", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handlePresetSelect = (preset: ThemePreset) => {
    setColors(preset.colors);
    setActivePresetId(preset.id);
  };

  const handleColorChange = (key: keyof ColorPalette, value: string) => {
    const updated = { ...colors, [key]: value };
    setColors(updated);
    
    // Check if the manual edit matches any preset
    const matchedPreset = PRESETS.find(
      (p) =>
        p.colors.background.toLowerCase() === updated.background.toLowerCase() &&
        p.colors.foreground.toLowerCase() === updated.foreground.toLowerCase() &&
        p.colors.primary.toLowerCase() === updated.primary.toLowerCase() &&
        p.colors.secondary.toLowerCase() === updated.secondary.toLowerCase() &&
        p.colors.accent.toLowerCase() === updated.accent.toLowerCase()
    );
    setActivePresetId(matchedPreset ? matchedPreset.id : "custom");
  };

  const handleReset = () => {
    if (originalColors) {
      setColors(originalColors);
      
      const matchedPreset = PRESETS.find(
        (p) =>
          p.colors.background.toLowerCase() === originalColors.background.toLowerCase() &&
          p.colors.foreground.toLowerCase() === originalColors.foreground.toLowerCase() &&
          p.colors.primary.toLowerCase() === originalColors.primary.toLowerCase() &&
          p.colors.secondary.toLowerCase() === originalColors.secondary.toLowerCase() &&
          p.colors.accent.toLowerCase() === originalColors.accent.toLowerCase()
      );
      setActivePresetId(matchedPreset ? matchedPreset.id : "custom");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme_colors: colors,
        }),
      });

      if (res.ok) {
        await refreshConfig();
        popup.open("Diseño y colores actualizados con éxito", true);
        setTimeout(() => onClose(), 1500);
      } else {
        popup.open("Error al guardar la configuración", false);
      }
    } catch (err) {
      console.error(err);
      popup.open("Error de conexión con el servidor", false);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    originalColors &&
    (colors.background.toLowerCase() !== originalColors.background.toLowerCase() ||
      colors.foreground.toLowerCase() !== originalColors.foreground.toLowerCase() ||
      colors.primary.toLowerCase() !== originalColors.primary.toLowerCase() ||
      colors.secondary.toLowerCase() !== originalColors.secondary.toLowerCase() ||
      colors.accent.toLowerCase() !== originalColors.accent.toLowerCase());

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  const contrastAccent = getContrastColor(colors.accent);

  return (
    <>
      <Modal onClose={onClose} size="lg">
        <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-[var(--foreground)] via-[var(--foreground)] to-[var(--accent)] bg-clip-text text-transparent tracking-tight mb-2">
          Diseño y Colores del Local
        </h2>
        <p className="text-xs text-[var(--foreground)]/50 mb-6 text-center max-w-lg mx-auto">
          Personalizá el look & feel del gestor de turnos. Seleccioná una de nuestras paletas premium diseñadas profesionalmente o creá tu propio estilo personalizado.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* LEFT COLUMN: Controls */}
          <div className="space-y-6">
            {/* Presets Grid */}
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">
                Temas Predefinidos
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESETS.map((preset) => {
                  const isActive = activePresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className={`flex flex-col !p-3 !rounded-xl !border !text-left transition-all cursor-pointer ${
                        isActive
                          ? "!border-[var(--accent)] !bg-[#131c33]/70 !shadow-md shadow-[var(--accent)]/5"
                          : "!border-slate-800 !bg-slate-950/20 hover:!border-slate-700 hover:!bg-slate-950/40"
                      }`}
                    >
                      <span className="!text-xs font-bold !text-slate-100 flex items-center justify-between w-full">
                        {preset.name}
                        {isActive && <Check size={14} className="text-[var(--accent)]" />}
                      </span>
                      <div className="flex gap-1.5 mt-2">
                        <span
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: preset.colors.background }}
                          title="Fondo"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: preset.colors.primary }}
                          title="Primario"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: preset.colors.secondary }}
                          title="Secundario"
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white/10"
                          style={{ backgroundColor: preset.colors.accent }}
                          title="Acento"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Pickers */}
            <div className="border-t border-slate-800 pt-5">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                  Personalización de Colores
                </label>
                {activePresetId === "custom" && (
                  <span className="text-[10px] bg-[var(--accent)]/15 text-[var(--accent)] px-2 py-0.5 rounded-full font-bold">
                    Paleta Manual
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Background */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                    <input
                      type="color"
                      value={colors.background}
                      onChange={(e) => handleColorChange("background", e.target.value)}
                      className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 border-none bg-transparent"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-300">Fondo</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{colors.background}</span>
                  </div>
                </div>

                {/* Foreground */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                    <input
                      type="color"
                      value={colors.foreground}
                      onChange={(e) => handleColorChange("foreground", e.target.value)}
                      className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 border-none bg-transparent"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-300">Textos</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{colors.foreground}</span>
                  </div>
                </div>

                {/* Primary */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                    <input
                      type="color"
                      value={colors.primary}
                      onChange={(e) => handleColorChange("primary", e.target.value)}
                      className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 border-none bg-transparent"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-300">Primario</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{colors.primary}</span>
                  </div>
                </div>

                {/* Secondary */}
                <div className="flex items-center gap-2.5">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                    <input
                      type="color"
                      value={colors.secondary}
                      onChange={(e) => handleColorChange("secondary", e.target.value)}
                      className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 border-none bg-transparent"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-300">Secundario</span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{colors.secondary}</span>
                  </div>
                </div>

                {/* Accent */}
                <div className="flex items-center gap-2.5 col-span-2 border-t border-dashed border-slate-800/60 pt-3 mt-1">
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 ring-2 ring-[var(--accent)]/20">
                    <input
                      type="color"
                      value={colors.accent}
                      onChange={(e) => handleColorChange("accent", e.target.value)}
                      className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 border-none bg-transparent"
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-extrabold text-[var(--accent)] flex items-center gap-1">
                      Acento de Marca <Palette size={12} />
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{colors.accent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Realtime Live Preview Sandbox */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-3">
                Previsualización en Tiempo Real
              </label>

              {/* Dynamic Sandbox Box */}
              <div
                className="p-5 rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden"
                style={{
                  backgroundColor: colors.background,
                  color: colors.foreground,
                  borderColor: `${colors.foreground}15`,
                }}
              >
                {/* Simulator header */}
                <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: `${colors.foreground}10` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: colors.accent }} />
                    <span className="text-xs font-black tracking-tight">
                      {businessSettings?.business_name || "Mi Local Premium"}
                    </span>
                  </div>
                  <span className="text-[8px] bg-slate-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider opacity-60">
                    Sandbox
                  </span>
                </div>

                {/* Simulator content body */}
                <div className="space-y-3.5">
                  <div className="text-center py-2">
                    <p className="text-[9px] uppercase font-bold tracking-widest mb-0.5" style={{ color: colors.accent }}>
                      ¡Bienvenido a nuestro salón!
                    </p>
                    <h4 className="text-sm font-extrabold">Reservá tu Turno</h4>
                  </div>

                  {/* Simulator Card 1 */}
                  <div
                    className="p-3 rounded-xl border flex items-center justify-between transition-all duration-300"
                    style={{
                      backgroundColor: colors.primary,
                      borderColor: `${colors.foreground}10`,
                    }}
                  >
                    <div className="text-left">
                      <p className="text-xs font-bold">Corte de Cabello</p>
                      <p className="text-[10px] opacity-60">30 min • $4500</p>
                    </div>
                    <span
                      className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider"
                      style={{
                        backgroundColor: colors.accent,
                        color: contrastAccent,
                      }}
                    >
                      Popular
                    </span>
                  </div>

                  {/* Simulator Input Mock */}
                  <div
                    className="p-2.5 rounded-lg border text-[10px] opacity-80 text-left"
                    style={{
                      backgroundColor: colors.secondary,
                      color: colors.foreground,
                      borderColor: `${colors.foreground}10`,
                    }}
                  >
                    📅 Seleccioná tu Barbero Preferido...
                  </div>

                  {/* Simulator Action Button */}
                  <button
                    type="button"
                    className="w-full text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-300 active:scale-95 cursor-default"
                    style={{
                      backgroundColor: colors.accent,
                      color: contrastAccent,
                    }}
                  >
                    Confirmar Turno
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic mt-3 text-center leading-relaxed">
                * El simulador refleja de forma exacta cómo se adaptarán los fondos, textos, botones y elementos destacados con la configuración actual.
              </p>
            </div>

            {/* Reset / Actions */}
            <div className="flex gap-3 pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={handleReset}
                disabled={!hasChanges || saving}
                className="flex items-center justify-center gap-1.5 !py-2.5 !px-4 !border !border-slate-800 hover:!border-slate-700 !bg-slate-950/20 hover:!bg-slate-950/40 !text-xs !font-bold !rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed !text-slate-300 cursor-pointer"
              >
                <Undo size={14} />
                Deshacer
              </button>
              
              <div className="flex-grow">
                <SaveButton
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                  loading={saving}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
