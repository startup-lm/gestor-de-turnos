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
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      const stored = loadStoredAuth();
      if (stored?.user) return stored.user;
    }
    return null;
  });

  const [role, setRole] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const stored = loadStoredAuth();
      if (stored?.role) return stored.role;
    }
    return "guest";
  });

  const [barberId, setBarberId] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = loadStoredAuth();
      if (stored?.barberId !== undefined) return stored.barberId;
    }
    return -1;
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setUser(stored.user);
      setRole(stored.role);
      setBarberId(stored.barberId);
    }

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
    saveStoredAuth({ user, role, barberId });
  }, [user, role, barberId]);

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
