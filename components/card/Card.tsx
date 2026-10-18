"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import Image from "next/image";
import React, { useState } from "react";
import DeleteCardButton from "./DeleteCardButton";
import EditCardButton from "./EditCardButton";
import logo from "@/public/images/logo.png";

interface CardProps {
  title: string;
  price: number;
  description: string;
  image: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onCardClick?: () => void;
  isDeleting?: boolean;
}

export default function Card({
  title,
  price,
  description,
  image,
  onEdit,
  onDelete,
  onCardClick,
  isDeleting = false,
}: Readonly<CardProps>) {
  const { role } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="relative w-[320px] h-[348px] border border-[var(--foreground)]/10 rounded-2xl p-4 flex flex-col items-center text-center bg-gradient-to-b from-[var(--foreground)]/8 to-[var(--foreground)]/4 backdrop-blur-md max-w-xs shadow-lg hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden group"
      onClick={() => {
        if (!confirmDelete && onCardClick) {
          onCardClick();
        }
      }}
    >
      {/* Inline Delete Confirmation Overlay */}
      {confirmDelete && (
        <div
          className="absolute inset-0 z-20 bg-[var(--background)]/95 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center rounded-2xl border border-red-500/30 animate-in fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </div>
          <h4 className="text-sm font-bold text-[var(--foreground)] mb-1">¿Eliminar este elemento?</h4>
          <p className="text-xs text-[var(--foreground)]/60 mb-5">Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg border border-[var(--foreground)]/10 text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                if (onDelete) onDelete();
              }}
              disabled={isDeleting}
              className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer shadow-md shadow-red-500/20 disabled:opacity-50"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      )}

      {role === "admin" && !confirmDelete && (
        <>
          {onDelete && (
            <div
              className="absolute top-3 left-3 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete(true);
              }}
            >
              <DeleteCardButton onDelete={() => setConfirmDelete(true)} />
            </div>
          )}
          {onEdit && (
            <div
              className="absolute top-3 right-3 z-10"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <EditCardButton onEdit={onEdit} />
            </div>
          )}
        </>
      )}

      <div className="w-40 h-40 relative mb-3 rounded-xl overflow-hidden border border-[var(--foreground)]/5 shadow-md">
        <Image
          src={image || logo}
          alt={title}
          fill
          className={`transition-transform duration-500 group-hover:scale-105 ${!image ? "bg-[var(--background)] p-4 object-contain" : "object-cover"}`}
          priority
          sizes="160px"
        />
      </div>

      <h3 className="text-[var(--foreground)] mb-1 font-bold text-lg tracking-wide line-clamp-1 w-full">{title}</h3>
      <p className="text-xs text-[var(--foreground)]/70 mb-3 line-clamp-2 min-h-[2.75rem] leading-relaxed px-2 w-full">{description}</p>
      <span className="text-xl font-bold text-[var(--accent)] tracking-wider mt-auto">
        {price === 0 ? "Sin stock" : `$${price.toLocaleString("es-AR")}`}
      </span>
    </div>
  );
}
