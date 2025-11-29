import React, { useState, ChangeEventHandler } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputPasswordProps {
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  error?: string;
  requiered?: boolean;
}

export default function InputPassword({ label,value,onChange, placeholder = "", error, requiered=false}: Readonly<InputPasswordProps>) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium mb-1 mt-4">{label}</label>
      <div className="relative">
        <input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`border p-2 pr-10 rounded w-full ${error ? "border-red-500" : ""}`}
          required={requiered}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setIsVisible((v) => !v)} >
          {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
