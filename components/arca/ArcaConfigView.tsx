"use client";

import React from "react";
import type { ArcaConfig, ArcaEnvironment, ArcaStatus, ArcaTestResult } from "@/lib/types/Arca";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe,
  KeyRound,
  PlugZap,
  ShieldCheck,
  Save,
  Loader2,
  XCircle,
} from "lucide-react";

const ENV_LABELS: Record<ArcaEnvironment, string> = {
  homo: "Homologación (pruebas de ARCA)",
  prod: "Producción (comprobantes oficiales)",
};

interface ArcaConfigViewProps {
  config: ArcaConfig | null;
  status: ArcaStatus | null;
  environment: ArcaEnvironment;
  setEnvironment: (val: ArcaEnvironment) => void;
  cuit: string;
  setCuit: (val: string) => void;
  pointOfSale: string;
  setPointOfSale: (val: string) => void;
  wsaaUrl: string;
  setWsaaUrl: (val: string) => void;
  wsfeUrl: string;
  setWsfeUrl: (val: string) => void;
  legalName: string;
  setLegalName: (val: string) => void;
  fiscalAddress: string;
  setFiscalAddress: (val: string) => void;
  grossIncome: string;
  setGrossIncome: (val: string) => void;
  activityStartDate: string;
  setActivityStartDate: (val: string) => void;
  certPem: string;
  setCertPem: (val: string) => void;
  keyPem: string;
  setKeyPem: (val: string) => void;
  keyPassphrase: string;
  setKeyPassphrase: (val: string) => void;
  savingConfig: boolean;
  hasConfigChanges: boolean;
  readyLabel: string;
  onSave: (e: React.FormEvent) => Promise<void>;
  testing: boolean;
  testResult: ArcaTestResult | null;
  onTest: () => Promise<void>;
  onBack?: () => void;
}

export default function ArcaConfigView({
  config,
  status,
  environment,
  setEnvironment,
  cuit,
  setCuit,
  pointOfSale,
  setPointOfSale,
  wsaaUrl,
  setWsaaUrl,
  wsfeUrl,
  setWsfeUrl,
  legalName,
  setLegalName,
  fiscalAddress,
  setFiscalAddress,
  grossIncome,
  setGrossIncome,
  activityStartDate,
  setActivityStartDate,
  certPem,
  setCertPem,
  keyPem,
  setKeyPem,
  keyPassphrase,
  setKeyPassphrase,
  savingConfig,
  hasConfigChanges,
  readyLabel,
  onSave,
  testing,
  testResult,
  onTest,
  onBack,
}: Readonly<ArcaConfigViewProps>) {
  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* ── Barra Superior de Navegación ────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/40">
        <div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[var(--accent)] hover:text-white transition-colors cursor-pointer group mb-1"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Volver a facturación</span>
            </button>
          )}
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Configuración ARCA
            </h2>
            {status && (
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                  status.ready
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                }`}
              >
                {readyLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Datos fiscales y certificado para emitir Factura C con los web services de ARCA
          </p>
        </div>

        <div className="flex items-center self-start sm:self-auto">
          <button
            form="arca-config-form"
            type="submit"
            disabled={!hasConfigChanges || savingConfig}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all shadow-md min-h-[40px] ${
              hasConfigChanges && !savingConfig
                ? "!bg-[var(--accent)] hover:!bg-[var(--accent-hover)] !text-slate-950 shadow-[var(--accent)]/20 cursor-pointer active:scale-95"
                : "!bg-white/5 !text-slate-500 border border-white/10 cursor-not-allowed opacity-50"
            }`}
          >
            {savingConfig ? (
              <Loader2 className="w-4 h-4 animate-spin text-inherit" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Formulario de Configuración ──────────────────────────── */}
      <form id="arca-config-form" onSubmit={onSave} className="space-y-6">
        {/* Sección 1: Parámetros del Contribuyente */}
        <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--foreground)]/10">
            <Building2 className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Datos del contribuyente</h3>
              <p className="text-xs text-slate-400">Identificación fiscal del negocio y punto de venta asignado</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Entorno de facturación <span className="text-rose-400">*</span>
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as ArcaEnvironment)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-[var(--background)] border-[var(--foreground)]/15 text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              >
                <option value="homo">{ENV_LABELS.homo}</option>
                <option value="prod">{ENV_LABELS.prod}</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Homologación para probar con ARCA sin validez fiscal; producción para facturas reales.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                CUIT del emisor <span className="text-rose-400">*</span>
              </label>
              <input
                value={cuit}
                onChange={(e) => setCuit(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="20xxxxxxxx9"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                CUIT de 11 dígitos sin guiones registrado en ARCA.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Punto de venta <span className="text-rose-400">*</span>
              </label>
              <input
                value={pointOfSale}
                onChange={(e) => setPointOfSale(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="1"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Punto de venta de ARCA dado de alta como &quot;Factura electrónica - Web services&quot;.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4 border-t border-[var(--foreground)]/10">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Razón social
              </label>
              <input
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="Nombre o razón social del emisor"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Aparece en el encabezado del comprobante legal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Domicilio comercial
              </label>
              <input
                value={fiscalAddress}
                onChange={(e) => setFiscalAddress(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="Calle, número y localidad fiscal"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Dirección fiscal registrada ante ARCA.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Ingresos brutos
              </label>
              <input
                value={grossIncome}
                onChange={(e) => setGrossIncome(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="Nro. de IIBB o CUIT"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Número de inscripción en Ingresos Brutos provincial o CUIT.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Inicio de actividades
              </label>
              <input
                type="date"
                value={activityStartDate}
                onChange={(e) => setActivityStartDate(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-[var(--background)] border-[var(--foreground)]/15 text-[var(--foreground)] focus:border-[var(--accent)] outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Fecha declarada de inicio de actividades comerciales.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 2: Certificados Digitales y Seguridad */}
        <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--foreground)]/10">
            <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Certificados digitales X.509</h3>
              <p className="text-xs text-slate-400">
                Clave privada y certificado emitido por la delegación de ARCA (ex AFIP)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Certificado digital (PEM)</label>
                {config && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      config.has_cert
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-500/15 text-slate-400"
                    }`}
                  >
                    {config.has_cert ? "✓ Certificado cargado" : "Sin certificado"}
                  </span>
                )}
              </div>
              <textarea
                value={certPem}
                onChange={(e) => setCertPem(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs font-mono h-28 bg-transparent border-[var(--foreground)]/15 text-slate-200 placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pegá el contenido completo del archivo .crt o .pem si necesitás actualizarlo.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Clave privada (PEM)</label>
                {config && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      config.has_key
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-slate-500/15 text-slate-400"
                    }`}
                  >
                    {config.has_key ? "✓ Clave cargada" : "Sin clave"}
                  </span>
                )}
              </div>
              <textarea
                value={keyPem}
                onChange={(e) => setKeyPem(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-xs font-mono h-28 bg-transparent border-[var(--foreground)]/15 text-slate-200 placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pegá el contenido completo de tu clave privada en formato PEM.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Passphrase de la clave (opcional)</span>
              </label>
              <input
                value={keyPassphrase}
                onChange={(e) => setKeyPassphrase(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="Solo si generaste tu clave privada con contraseña"
                type="password"
              />
            </div>
          </div>
        </section>

        {/* Sección 3: Endpoints Web Services SOAP (Opcional / Avanzado) */}
        <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--foreground)]/10">
            <Globe className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[var(--foreground)]">Endpoints web services SOAP</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                  Opcional / Avanzado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Solo completá estas URLs si utilizás un servidor intermedio o proxy específico
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">URL de WSAA (autenticación)</label>
              <input
                value={wsaaUrl}
                onChange={(e) => setWsaaUrl(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="https://.../LoginCms (vacío: la oficial de ARCA)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">URL de WSFE (facturación)</label>
              <input
                value={wsfeUrl}
                onChange={(e) => setWsfeUrl(e.target.value)}
                className="w-full border rounded-xl px-3 py-2 text-sm bg-transparent border-[var(--foreground)]/15 text-[var(--foreground)] placeholder:text-slate-600 focus:border-[var(--accent)] outline-none"
                placeholder="https://.../wsfev1/service.asmx (vacío: la oficial de ARCA)"
              />
            </div>
          </div>
        </section>
      </form>

      {/* Sección 4: Probar conexión */}
      <section className="bg-[var(--foreground)]/5 border border-[var(--foreground)]/10 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--foreground)]/10">
          <div className="flex items-center gap-2.5">
            <PlugZap className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Probar conexión</h3>
              <p className="text-xs text-slate-400">
                {hasConfigChanges
                  ? "Guardá los cambios antes de probar"
                  : "Verifica los servidores de ARCA, el certificado y el punto de venta sin emitir nada"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTest}
            disabled={testing || hasConfigChanges}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold min-h-[44px] border border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
            <span>Probar conexión</span>
          </button>
        </div>

        {testResult && (
          <ul className="space-y-2 text-sm">
            {testResult.steps.map((step) => (
              <li key={step.label} className="flex items-start gap-2.5">
                {step.ok ? (
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-[var(--foreground)]">{step.label}</p>
                  <p className="text-xs text-slate-400 break-words">{step.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
