"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { GlobalHours } from "@/lib/types/BusinessHours";
import { BusinessSettings } from "@/lib/types/BusinessSettings";
import { getCalendarConfig, CalendarConfig } from "@/lib/repository/calendar";
import { isFeatureEnabled, getPlanLimits, FeatureFlagName, PlanLimits } from "@/lib/flags";

export const DEFAULT_BUSINESS_HOURS: GlobalHours = {
  open_time: "09:00",
  close_time: "20:00",
  lunch_start: null,
  lunch_end: null,
  closed_days: [0],
};

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  slot_step_minutes: 30,
  business_name: "Barbería",
};

interface BusinessContextType {
  businessHours: GlobalHours;
  businessSettings: BusinessSettings;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
  isFeatureEnabled: (flag: FeatureFlagName) => boolean;
  isEnabled: (flag: FeatureFlagName) => boolean;
  limits: PlanLimits;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({
  children,
  initialConfig,
}: Readonly<{ children: React.ReactNode; initialConfig?: CalendarConfig }>) {
  const [businessHours, setBusinessHours] = useState<GlobalHours>(
    () => initialConfig?.businessHours ?? DEFAULT_BUSINESS_HOURS
  );
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(
    () => initialConfig?.businessSettings ?? DEFAULT_BUSINESS_SETTINGS
  );
  const [isLoading, setIsLoading] = useState(!initialConfig);

  const fetchConfig = useCallback(async () => {
    try {
      const config = await getCalendarConfig(true);
      setBusinessHours(config.businessHours);
      setBusinessSettings(config.businessSettings);
    } catch (error) {
      console.error("Error fetching business config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Si no vino configuración inicial del servidor (ej. navegación client-only), la buscamos
  useEffect(() => {
    if (!initialConfig) {
      fetchConfig();
    }
  }, [initialConfig, fetchConfig]);

  useEffect(() => {
    if (typeof window !== "undefined" && businessSettings?.business_name) {
      document.title = businessSettings.business_name;
    }
  }, [businessSettings?.business_name]);

  const checkFlag = useCallback((flag: FeatureFlagName) => {
    return isFeatureEnabled(flag, businessSettings?.features, businessSettings?.plan);
  }, [businessSettings?.features, businessSettings?.plan]);

  const limits = useMemo(() => getPlanLimits(businessSettings?.plan), [businessSettings?.plan]);

  const value = useMemo(
    () => ({
      businessHours,
      businessSettings,
      isLoading,
      refreshConfig: fetchConfig,
      isFeatureEnabled: checkFlag,
      isEnabled: checkFlag,
      limits,
    }),
    [businessHours, businessSettings, isLoading, fetchConfig, checkFlag, limits]
  );

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
  return {
    businessHours: context.businessHours || DEFAULT_BUSINESS_HOURS,
    businessSettings: context.businessSettings || DEFAULT_BUSINESS_SETTINGS,
    isLoading: context.isLoading,
    refreshConfig: context.refreshConfig,
    isFeatureEnabled: context.isFeatureEnabled,
    isEnabled: context.isEnabled,
    limits: context.limits,
  };
}
