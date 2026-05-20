"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import Image from "next/image";
import React from "react";
import DeleteCardButton from "./DeleteCardButton";
import EditCardButton from "./EditCardButton";
import logo from "@/public/images/logo.png";

interface CardProps {
  title: string;
  price: number;
  description: string;
  image: string;
  onEdit: () => void;
  onDelete: () => void;
  onCardClick?: () => void;
}

export default function Card({ title, price, description, image, onEdit, onDelete, onCardClick }: Readonly<CardProps>) {
  const { role } = useAuth();

  return (
    <div
      className="relative w-[320px] h-[326px] border border-[var(--foreground)]/10 rounded-2xl p-4 flex flex-col items-center text-center bg-gradient-to-b from-[var(--foreground)]/8 to-[var(--foreground)]/4 backdrop-blur-md max-w-xs shadow-lg hover:border-[var(--accent)]/40 hover:shadow-xl hover:shadow-[var(--accent)]/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      onClick={role === "guest" ? onCardClick : undefined}
    >
      {role === "admin" && (
        <>
          <div className="absolute top-3 left-3 z-10">
            <DeleteCardButton onDelete={onDelete} />
          </div>
          <div className="absolute top-3 right-3 z-10">
            <EditCardButton onEdit={onEdit} />
          </div>
        </>
      )}

      <div className="w-40 h-40 relative mb-4 rounded-xl overflow-hidden border border-[var(--foreground)]/5 shadow-md">
        <Image
          src={image || logo}
          alt={title}
          fill
          className={`transition-transform duration-500 hover:scale-105 ${!image ? "bg-[var(--background)] p-4 object-contain" : "object-cover"}`}
          priority
          sizes="160px"
        />
      </div>

      <h3 className="text-[var(--foreground)] mb-1.5 font-bold text-lg tracking-wide line-clamp-1 w-full">{title}</h3>
      <p className="text-xs text-[var(--foreground)]/70 mb-4 line-clamp-2 h-8 leading-relaxed px-2 w-full">{description}</p>
      <span className="text-xl font-bold text-[var(--accent)] tracking-wider mt-auto">
        {price === 0 ? "Sin stock" : `$${price.toLocaleString("es-AR")}`}
      </span>
    </div >
  );
}
