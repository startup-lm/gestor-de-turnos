"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import { usePopup } from "@/lib/hooks/usePopup";
import PopupModal from "@/components/ui/PopupModal";
import Spinner from "@/components/loading/Spinner";

interface Props {
  onClose: () => void;
}

export default function OurStorySettingsModal({ onClose }: Readonly<Props>) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [story, setStory] = useState("");
  const popup = usePopup();

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/business-settings");
        if (res.ok) {
          const data = await res.json();
          setStory((data.our_story || []).join("\n\n"));
        }
      } catch {
        console.error("Failed to fetch");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const storyArray = story.split("\n\n").map(s => s.trim()).filter(s => s.length > 0);
    try {
      const res = await fetch("/api/business-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ our_story: storyArray }),
      });

      if (res.ok) {
        popup.open("Historia actualizada con éxito", true);
        setTimeout(() => onClose(), 1500);
      } else {
        popup.open("Error al guardar la historia", false);
      }
    } catch {
      popup.open("Error al conectar con el servidor", false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <Modal onClose={onClose}>
        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--foreground)]">Nuestra Historia</h2>

        <div className="space-y-4 px-2">
          <p className="text-sm text-gray-500 mb-2">
            Escribí la historia del local. Separala por párrafos usando doble "Enter" (dejando una línea en blanco entre cada uno).
          </p>
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            className="w-full h-64 bg-[var(--background)] border border-[var(--border)] rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"
            placeholder="Todo empezó en..."
          />
        </div>

        <div className="flex justify-end pt-6 mt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-2"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="!bg-[var(--primary)] !text-black px-6 py-2 rounded-xl font-bold shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--primary)]/40 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </Modal>

      {popup.show && (
        <PopupModal message={popup.message} success={popup.success} onClose={popup.close} />
      )}
    </>
  );
}
