"use client";

import CloseButton from "../buttons/CloseButton";

export default function Modal({onClose,children,className=""}: Readonly<{onClose: () => void;children: React.ReactNode;className?:string;}>) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 px-4" onClick={onClose} >
      <div className={`relative bg-[var(--background)] rounded-2xl shadow-xl px-6 py-8 md:px-10 md:py-12 max-w-sm w-full text-center ${className}`} onClick={(e) => e.stopPropagation()} >
        <CloseButton onClose={onClose} />
        {children}
      </div>
    </div>
  );
}
