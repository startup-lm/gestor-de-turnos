"use client";

import { useEffect, useMemo, useState } from "react";
import { ConfigFormSkeleton } from "@/components/loading/Skeleton";
import { toast } from "@/lib/store/useToastStore";
import { useFetchOnce } from "@/lib/hooks/useFetchOnce";
import ArcaConfigView from "@/components/arca/ArcaConfigView";
import { getArcaConfig, getArcaStatus, testArcaConnection, updateArcaConfig } from "@/lib/repository/arca";
import type { ArcaConfig, ArcaEnvironment, ArcaStatus, ArcaTestResult } from "@/lib/types/Arca";

export default function ArcaConfigSection() {
  const {
    data: config,
    loading: loadingConfig,
    refetch: refetchConfig,
  } = useFetchOnce<ArcaConfig>("arcaConfig", getArcaConfig);
  const {
    data: status,
    loading: loadingStatus,
    refetch: refetchStatus,
  } = useFetchOnce<ArcaStatus>("arcaStatus", getArcaStatus);

  const [environment, setEnvironment] = useState<ArcaEnvironment>("homo");
  const [cuit, setCuit] = useState("");
  const [pointOfSale, setPointOfSale] = useState("");
  const [wsaaUrl, setWsaaUrl] = useState("");
  const [wsfeUrl, setWsfeUrl] = useState("");
  const [certPem, setCertPem] = useState("");
  const [keyPem, setKeyPem] = useState("");
  const [keyPassphrase, setKeyPassphrase] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ArcaTestResult | null>(null);

  useEffect(() => {
    if (!config) return;
    setEnvironment(config.environment ?? "homo");
    setCuit(config.cuit ?? "");
    setPointOfSale(config.point_of_sale ? String(config.point_of_sale) : "");
    setWsaaUrl(config.wsaa_url ?? "");
    setWsfeUrl(config.wsfe_url ?? "");
  }, [config]);

  const hasConfigChanges = useMemo(() => {
    if (!config) return false;
    const initialEnv = config.environment ?? "homo";
    const initialCuit = config.cuit ?? "";
    const initialPos = config.point_of_sale ? String(config.point_of_sale) : "";
    const initialWsaa = config.wsaa_url ?? "";
    const initialWsfe = config.wsfe_url ?? "";

    return (
      environment !== initialEnv ||
      cuit.trim() !== initialCuit ||
      pointOfSale.trim() !== initialPos ||
      wsaaUrl.trim() !== initialWsaa ||
      wsfeUrl.trim() !== initialWsfe ||
      certPem.trim() !== "" ||
      keyPem.trim() !== "" ||
      keyPassphrase.trim() !== ""
    );
  }, [config, environment, cuit, pointOfSale, wsaaUrl, wsfeUrl, certPem, keyPem, keyPassphrase]);

  const readyLabel = useMemo(() => {
    if (!status) return "";
    return status.ready ? "Listo para emitir" : "Faltan datos de ARCA";
  }, [status]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const payload: Record<string, unknown> = {
        environment,
        cuit: cuit.trim() || null,
        pointOfSale: pointOfSale ? Number(pointOfSale) : null,
        wsaaUrl: wsaaUrl.trim() || null,
        wsfeUrl: wsfeUrl.trim() || null,
      };
      if (certPem.trim()) payload.certPem = certPem.trim();
      if (keyPem.trim()) payload.keyPem = keyPem.trim();
      if (keyPassphrase.trim()) payload.keyPassphrase = keyPassphrase.trim();

      await updateArcaConfig(payload);
      setCertPem("");
      setKeyPem("");
      setKeyPassphrase("");
      setTestResult(null);
      toast.success("Configuración ARCA guardada con éxito");
      await Promise.all([refetchConfig(), refetchStatus()]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar la configuración ARCA");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await testArcaConnection();
      setTestResult(result);
      if (result.success) toast.success("Conexión con ARCA verificada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo probar la conexión con ARCA");
    } finally {
      setTesting(false);
    }
  };

  if (loadingConfig || loadingStatus) {
    return <ConfigFormSkeleton />;
  }

  return (
    <ArcaConfigView
      config={config}
      status={status}
      environment={environment}
      setEnvironment={setEnvironment}
      cuit={cuit}
      setCuit={setCuit}
      pointOfSale={pointOfSale}
      setPointOfSale={setPointOfSale}
      wsaaUrl={wsaaUrl}
      setWsaaUrl={setWsaaUrl}
      wsfeUrl={wsfeUrl}
      setWsfeUrl={setWsfeUrl}
      certPem={certPem}
      setCertPem={setCertPem}
      keyPem={keyPem}
      setKeyPem={setKeyPem}
      keyPassphrase={keyPassphrase}
      setKeyPassphrase={setKeyPassphrase}
      savingConfig={savingConfig}
      hasConfigChanges={hasConfigChanges}
      readyLabel={readyLabel}
      onSave={handleSaveConfig}
      testing={testing}
      testResult={testResult}
      onTest={handleTest}
    />
  );
}
