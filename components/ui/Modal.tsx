"use client";

import CloseButton from "../buttons/CloseButton";

type ModalSize = "sm" | "md" | "lg" | "xl";

export default function Modal({
  onClose,
  children,
  className = "",
  size = "sm",
  leftHeaderElement
}: Readonly<{
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: ModalSize;
  leftHeaderElement?: React.ReactNode;
}>) {
  const sizeClasses = {
    sm: "max-w-sm w-full",
    md: "max-w-md w-full",
    lg: "max-w-lg md:max-w-2xl w-full",
    xl: "max-w-xl md:max-w-4xl w-full",
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex justify-center items-center z-50 px-4 py-6" 
      onClick={onClose} 
    >
      <div 
        className={`relative bg-[var(--background)] border border-[var(--foreground)]/10 rounded-2xl shadow-2xl shadow-black/40 p-6 md:p-8 ${sizeClasses[size]} max-h-[90vh] flex flex-col ${className}`} 
        onClick={(e) => e.stopPropagation()} 
      >
        {leftHeaderElement}
        <CloseButton onClose={onClose} />
        <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
