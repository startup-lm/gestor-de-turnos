"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Client } from "@/lib/types/Client";
import { searchClients } from "@/lib/repository/clients";
import { FaWhatsapp } from "react-icons/fa";
import { sendWhatsAppMessage } from "@/utils/whatsapp";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { formatPhoneDisplay } from "@/utils/phone";

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
    onPhoneChange(v || "");
    onClientResolved(null);
    setActiveField("phone");
    if (v && v.length >= 2) scheduleSearch(v);
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
      <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-[var(--background)] border border-[var(--foreground)]/10 rounded-lg shadow-2xl overflow-hidden">
        {suggestions.map((c) => (
          <li
            key={c.id}
            onMouseDown={() => handleSelect(c)}
            className="flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-[var(--foreground)]/5 hover:text-[var(--accent)] transition-colors"
          >
            <span className="font-medium text-sm text-[var(--foreground)]">{c.name}</span>
            <span className="text-xs text-[var(--foreground)]/50 ml-3">{formatPhoneDisplay(c.phone)}</span>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Campo Nombre */}
      <div>
        <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Cliente</label>
        <div className="relative">
          <input
            id="client-name"
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => {
              setActiveField("name");
              if (name.length >= 2) fetchSuggestions(name);
            }}
            placeholder="Nombre y Apellido"
            autoComplete="off"
            className="!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 w-full block text-sm"
          />
          <Dropdown field="name" />
        </div>
      </div>

      {/* Campo Celular */}
      <div>
        <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">Celular</label>
        <div className="relative flex items-center space-x-1">
          <div className="relative flex-1">
            <PhoneInput
              id="client-phone"
              defaultCountry="AR"
              value={phone}
              onChange={(value) => handlePhoneChange(value || "")}
              onFocus={() => {
                setActiveField("phone");
                if (phone.length >= 2) fetchSuggestions(phone);
              }}
              placeholder="1123456789"
              autoComplete="off"
              className="w-full"
              numberInputProps={{
                className: "w-full border-none focus:outline-none p-0 bg-transparent text-[var(--foreground)] text-sm",
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid rgba(249, 250, 251, 0.1)',
                padding: '0.625rem',
                borderRadius: '0.5rem',
                backgroundColor: 'rgba(249, 250, 251, 0.05)',
              }}
            />
            <Dropdown field="phone" />
          </div>
          {showWhatsapp && (
            <button
              id="btn-client-whatsapp"
              type="button"
              onClick={() => sendWhatsAppMessage("Hola, te escribimos por lo siguiente...", phone)}
              className="btn-whatsapp !rounded-lg !px-3 !h-[42px] flex items-center justify-center transition-all hover:opacity-90"
              aria-label="Enviar Whatsapp"
              title="Enviar Whatsapp"
            >
              <FaWhatsapp size={20} color="white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
