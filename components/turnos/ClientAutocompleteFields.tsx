"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Client } from "@/lib/types/Client";
import { searchClients } from "@/lib/repository/clients";
import { FaWhatsapp } from "react-icons/fa";
import { sendWhatsAppMessage } from "@/utils/whatsapp";

interface Props {
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onClientResolved: (clientId: number | null) => void;
  showWhatsapp?: boolean;
}

/**
 * Reemplaza los inputs de Cliente y Celular con autocomplete.
 * Al escribir en cualquiera de los dos campos busca en la tabla clients
 * y sugiere coincidencias. Al seleccionar una sugerencia llena ambos campos
 * y notifica el client_id via onClientResolved.
 * Solo para uso del lado barbero (panel admin).
 */
export default function ClientAutocompleteFields({
  name,
  phone,
  onNameChange,
  onPhoneChange,
  onClientResolved,
  showWhatsapp = false,
}: Readonly<Props>) {
  const [suggestions, setSuggestions] = useState<Client[]>([]);
  const [activeField, setActiveField] = useState<"name" | "phone" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    const results = await searchClients(query);
    setSuggestions(results);
  }, []);

  const scheduleSearch = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
  };

  const handleNameChange = (v: string) => {
    onNameChange(v);
    onClientResolved(null);
    setActiveField("name");
    scheduleSearch(v);
  };

  const handlePhoneChange = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 10);
    onPhoneChange(digits);
    onClientResolved(null);
    setActiveField("phone");
    if (digits.length >= 2) scheduleSearch(digits);
    else setSuggestions([]);
  };

  const handleSelect = (client: Client) => {
    onNameChange(client.name);
    onPhoneChange(client.phone);
    onClientResolved(client.id);
    setSuggestions([]);
    setActiveField(null);
  };

  const closeSuggestions = () => {
    setSuggestions([]);
    setActiveField(null);
  };

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSuggestions();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const Dropdown = ({ field }: { field: "name" | "phone" }) =>
    activeField === field && suggestions.length > 0 ? (
      <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-[var(--background)] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
        {suggestions.map((c) => (
          <li
            key={c.id}
            onMouseDown={() => handleSelect(c)}
            className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="font-medium text-sm">{c.name}</span>
            <span className="text-xs text-gray-400 ml-3">{c.phone}</span>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={containerRef}>
      {/* Campo Nombre */}
      <label className="block text-sm font-medium mb-1 mt-4">Cliente</label>
      <div className="relative">
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          onFocus={() => {
            setActiveField("name");
            if (name.length >= 2) fetchSuggestions(name);
          }}
          placeholder="Nombre y Apellido"
          autoComplete="off"
        />
        <Dropdown field="name" />
      </div>

      {/* Campo Celular */}
      <label className="block text-sm font-medium mb-1 mt-4">Celular</label>
      <div className="relative flex items-center space-x-1">
        <div className="relative flex-1">
          <input
            type="text"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onFocus={() => {
              setActiveField("phone");
              if (phone.length >= 2) fetchSuggestions(phone);
            }}
            placeholder="1123456789"
            autoComplete="off"
            maxLength={10}
            inputMode="numeric"
          />
          <Dropdown field="phone" />
        </div>
        {showWhatsapp && (
          <button
            type="button"
            onClick={() => sendWhatsAppMessage("Hola, te escribimos por lo siguiente...", phone)}
            className="btn-whatsapp !rounded-lg !px-2 !py-1.5"
            aria-label="Enviar Whatsapp"
            title="Enviar Whatsapp"
          >
            <FaWhatsapp size={30} color="white" />
          </button>
        )}
      </div>
    </div>
  );
}
