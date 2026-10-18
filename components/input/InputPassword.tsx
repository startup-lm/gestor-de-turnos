import React, { useState, ChangeEventHandler } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

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
      <label className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Lock className="w-4 h-4" />
        </div>
        <input
          id={id}
          data-testid={dataTestId}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`!bg-[var(--foreground)]/5 !text-[var(--foreground)] !border-[var(--foreground)]/10 focus:!border-[var(--accent)]/50 focus:!ring-1 focus:!ring-[var(--accent)]/50 !transition-all !rounded-xl !pl-10 !pr-10 !py-3 !w-full !block !text-sm placeholder:text-slate-500 ${error ? "!border-red-500" : ""}`}
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
