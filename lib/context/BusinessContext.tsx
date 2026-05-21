"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { GlobalHours } from "@/lib/types/BusinessHours";
import { BusinessSettings } from "@/lib/types/BusinessSettings";
import { getCalendarConfig } from "@/lib/repository/calendar";
import Spinner from "@/components/loading/Spinner";

interface BusinessContextType {
  businessHours: GlobalHours | null;
  businessSettings: BusinessSettings | null;
  isLoading: boolean;
  refreshConfig: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [businessHours, setBusinessHours] = useState<GlobalHours | null>(null);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = async () => {
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
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && businessSettings?.business_name) {
      document.title = businessSettings.business_name;
    }
  }, [businessSettings?.business_name]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <BusinessContext.Provider value={{ businessHours, businessSettings, isLoading, refreshConfig: fetchConfig }}>
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
  };
}
