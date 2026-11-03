"use client";

import React from "react";
import { ArcaDocType } from "@/lib/types/Arca";
import { DOC_TYPES } from "@/lib/arca/docTypes";

interface ArcaDocFieldsProps {
  idPrefix: string;
  docType: ArcaDocType;
  onDocTypeChange: (t: ArcaDocType) => void;
  docNumber: string;
  onDocNumberChange: (v: string) => void;
  numberClassName?: string;
}

export default function ArcaDocFields({
  idPrefix,
  docType,
  onDocTypeChange,
  docNumber,
  onDocNumberChange,
  numberClassName,
}: Readonly<ArcaDocFieldsProps>) {
  return (
    <>
      <div>
        <label
          htmlFor={`${idPrefix}-doc-type`}
          className="block text-xs font-semibold text-[var(--accent)] mb-1.5"
        >
          Tipo de documento
        </label>
        <select
          id={`${idPrefix}-doc-type`}
          value={docType}
          onChange={(e) => onDocTypeChange(Number(e.target.value) as ArcaDocType)}
          className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-2.5 text-xs outline-none"
        >
          {DOC_TYPES.map((dt) => (
            <option key={dt.value} value={dt.value} style={{ color: "black" }}>
              {dt.label}
            </option>
          ))}
        </select>
      </div>

      {docType !== 99 && (
        <div className={numberClassName}>
          <label
            htmlFor={`${idPrefix}-doc-number`}
            className="block text-xs font-semibold text-[var(--accent)] mb-1.5"
          >
            Número de documento
          </label>
          <input
            id={`${idPrefix}-doc-number`}
            type="text"
            inputMode="numeric"
            required
            value={docNumber}
            onChange={(e) => onDocNumberChange(e.target.value.replace(/\D/g, ""))}
            placeholder="Sin puntos ni guiones"
            className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-2.5 text-xs outline-none"
          />
        </div>
      )}
    </>
  );
}
