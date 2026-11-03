/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {createContext,useContext,useEffect,useState,useMemo,useCallback,} from "react";
import { supabaseClient } from "../supabase/supabaseClient";
import { getIdAndRole } from "@/lib/repository/barbers";
import { loadStoredAuth, saveStoredAuth, clearStoredAuth, } from "./sessionStorage";

type AuthContextType = {
  user: any;
  role: string;
  barberId: number;
  isLoadingAuth: boolean;
  setRole: (role: string) => void;
  setBarberId: (barberId: number) => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // El primer render tiene que ser igual en el servidor y en el navegador (si no, React descarta
  // el HTML y el menú salta). La sesión guardada se lee recién en el efecto de montaje.
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string>("guest");
  const [barberId, setBarberId] = useState<number>(-1);

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  // Hasta leer la sesión guardada no se escribe: si no, el estado inicial de invitado la pisaría
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setUser(stored.user);
      setRole(stored.role);
      setBarberId(stored.barberId);
    }
    setHydrated(true);

    supabaseClient.auth.getUser().then(({ data: { user: supaUser } }) => {
      setUser(supaUser);
      setIsLoadingAuth(false);
    }).catch(() => {
      setIsLoadingAuth(false);
    });

    const { data: sub } = supabaseClient.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          const storedAuth = loadStoredAuth();
          if (storedAuth && storedAuth.user?.id === currentUser.id && storedAuth.role !== "guest") {
            setRole(storedAuth.role);
            setBarberId(storedAuth.barberId);
          } else {
            const result = await getIdAndRole(currentUser.email!);
            if (result) {
              setRole(result.role);
              setBarberId(result.id);
            } else {
              setRole("guest");
              setBarberId(-1);
            }
          }
        } else {
          setRole("guest");
          setBarberId(-1);
        }
        setIsLoadingAuth(false);
      }
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveStoredAuth({ user, role, barberId });
  }, [hydrated, user, role, barberId]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      const { data, error } =
        await supabaseClient.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        return { error: "Email o contraseña incorrecta/s" };
      }
      const result = await getIdAndRole(email);
      if (!result) {
        return { error: "No se pudo obtener rol de barbero" };
      }
      saveStoredAuth({ user: data.user, role: result.role, barberId: result.id });
      setUser(data.user);
      setBarberId(result.id);
      setRole(result.role);

      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    setRole("guest");
    setBarberId(-1);
    clearStoredAuth();
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      barberId,
      isLoadingAuth,
      setRole,
      setBarberId,
      signIn,
      signOut,
    }),
    [user, role, barberId, isLoadingAuth, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return ctx;
}
