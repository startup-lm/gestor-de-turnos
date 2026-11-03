"use client";

import React from "react";
import { ArcaDocType } from "@/lib/types/Arca";
import { DOC_TYPES } from "@/lib/arca/docTypes";
import { RECEIVER_IVA_CONDITIONS } from "@/lib/arca/receiverConditions";

interface ArcaDocFieldsProps {
  idPrefix: string;
  docType: ArcaDocType;
  onDocTypeChange: (t: ArcaDocType) => void;
  docNumber: string;
  onDocNumberChange: (v: string) => void;
  receiverCondition: number;
  onReceiverConditionChange: (v: number) => void;
  numberClassName?: string;
}

export default function ArcaDocFields({
  idPrefix,
  docType,
  onDocTypeChange,
  docNumber,
  onDocNumberChange,
  receiverCondition,
  onReceiverConditionChange,
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

      {/* Con DNI o consumidor final ARCA lo toma como consumidor final; con CUIT o CUIL hay que elegir */}
      {(docType === 80 || docType === 86) && (
        <div className={numberClassName}>
          <label
            htmlFor={`${idPrefix}-iva-condition`}
            className="block text-xs font-semibold text-[var(--accent)] mb-1.5"
          >
            Condición frente al IVA
          </label>
          <select
            id={`${idPrefix}-iva-condition`}
            value={receiverCondition}
            onChange={(e) => onReceiverConditionChange(Number(e.target.value))}
            className="w-full !bg-[var(--background)] !text-[var(--foreground)] !border !border-[var(--foreground)]/15 focus:!border-[var(--accent)] rounded-xl p-2.5 text-xs outline-none"
          >
            {RECEIVER_IVA_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value} style={{ color: "black" }}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
