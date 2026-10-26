"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { GlobalHours } from "@/lib/types/BusinessHours";
import { BusinessSettings } from "@/lib/types/BusinessSettings";
import { getCalendarConfig } from "@/lib/repository/calendar";
import Spinner from "@/components/loading/Spinner";

import { isFeatureEnabled, FeatureFlagName } from "@/lib/flags";

interface BusinessContextType {
  businessHours: GlobalHours | null;
  businessSettings: BusinessSettings | null;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  isFeatureEnabled: (flag: FeatureFlagName) => boolean;
  isEnabled: (flag: FeatureFlagName) => boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [businessHours, setBusinessHours] = useState<GlobalHours | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const config = await getCalendarConfig();
      setBusinessHours(config.businessHours);
      setBusinessSettings(config.businessSettings);
    } catch (error) {
      console.error("Error fetching business config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (typeof window !== "undefined" && businessSettings?.business_name) {
      document.title = businessSettings.business_name;
    }
  }, [businessSettings?.business_name]);

  const checkFlag = useCallback((flag: FeatureFlagName) => {
    return isFeatureEnabled(flag, businessSettings?.features);
  }, [businessSettings?.features]);

  const value = useMemo(
    () => ({
      businessHours,
      businessSettings,
      isLoading,
      refreshConfig: fetchConfig,
      isFeatureEnabled: checkFlag,
      isEnabled: checkFlag,
    }),
    [businessHours, businessSettings, isLoading, fetchConfig, checkFlag]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const colors = businessSettings?.theme_colors;

  return (
    <BusinessContext.Provider value={value}>
      {colors && (
        <style>
          {`
            :root {
              ${colors.background ? `--background: ${colors.background} !important;` : ""}
              ${colors.foreground ? `--foreground: ${colors.foreground} !important;` : ""}
              ${colors.primary ? `--primary: ${colors.primary} !important;` : ""}
              ${colors.secondary ? `--secondary: ${colors.secondary} !important;` : ""}
              ${colors.accent ? `--accent: ${colors.accent} !important;` : ""}
            }
          `}
        </style>
      )}
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusinessContext debe usarse dentro de un BusinessProvider");
  }
  // En este punto sabemos que no son null porque el Provider renderiza a los hijos solo si isLoading es falso.
  return {
    businessHours: context.businessHours!,
    businessSettings: context.businessSettings!,
    refreshConfig: context.refreshConfig,
    isFeatureEnabled: context.isFeatureEnabled,
    isEnabled: context.isEnabled,
  };
}
