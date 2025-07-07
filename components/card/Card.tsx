"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import Image from "next/image";
import React from "react";
import DeleteCardButton from "./DeleteCardButton";
import EditCardButton from "./EditCardButton";

interface CardProps {
  title: string;
  price: number;
  description: string;
  image: string;
  onEdit: () => void;
  onDelete: () => void;
}

export default function Card({ title, price, description, image, onEdit, onDelete }: Readonly<CardProps>) {
  const { role } = useAuth();

  return (
    <div className="relative w-[320px] h-[326px] border border-[var(--primary)] rounded-lg p-4 flex flex-col items-center text-center bg-[var(--accent)] max-w-xs shadow">
      {role === "admin" && (
        <div>
          <div className="absolute top-2 left-2 flex space-x-2">
            <DeleteCardButton onDelete={onDelete} />
          </div>
          <div className="absolute top-2 right-2 flex space-x-2">
            <EditCardButton onEdit={onEdit}/>
          </div>
        </div>
      )}

      <div className="w-40 h-40 relative mb-4">
        <Image src={image || "/images/logo_hooligans.png"} alt={title} fill style={{ objectFit: "cover" }} className={`rounded-lg ${!image ? "bg-[var(--background)]" : ""}`} priority sizes="160px" />
      </div>

      <h3 className="heading-black mb-1 font-bold">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <span className="text-2xl font-semibold text-black">
        {price === 0 ? "Sin stock" : `$${price.toLocaleString("es-AR")}`}
      </span>
    </div >
  );
}
