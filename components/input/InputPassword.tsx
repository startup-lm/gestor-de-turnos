import React, { useState, ChangeEventHandler } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputPasswordProps {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  error?: string;
  requiered?: boolean;
  "data-testid"?: string;
  id?: string;
}

export default function InputPassword({ label, value, onChange, placeholder = "", error, requiered=false, "data-testid": dataTestId, id }: Readonly<InputPasswordProps>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5 mt-4">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          data-testid={dataTestId}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 transition-all rounded-lg p-2.5 pr-10 w-full block text-sm ${error ? "!border-red-500" : ""}`}
          required={requiered}
        />
        <div 
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-[var(--foreground)]/40 hover:text-[var(--accent)] transition-colors" 
          onClick={() => setIsVisible((v) => !v)} 
        >
          {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}
