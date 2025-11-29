// components/AutoLogoutManager.tsx
"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

interface Props {
  timeoutMinutes: number;
}

export default function AutoLogoutManager({ timeoutMinutes }: Props) {
  const { user, signOut } = useAuth();

  const timerRef = useRef<number | null>(null);
  const timeoutMs = timeoutMinutes * 60 * 1000;

  // Función que ejecuta el cierre de sesión
  const logout = () => {
    signOut();
  };

  // Reinicia el temporizador de logout
  const resetTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(logout, timeoutMs);
  };

  useEffect(() => {
    if (!user) {
      // Si no hay usuario logueado, no iniciamos el timer ni escuchamos eventos
      return;
    }

    // Arrancamos el timer apenas el usuario esté logueado
    resetTimer();

    // Definimos los eventos que consideramos "actividad del usuario"
    // (puedes ajustar según lo que creas conveniente)
    const events = ["click", "mousemove", "keydown", "scroll", "touchstart"];

    // Cada vez que ocurra cualquiera de esos eventos, reiniciamos el timer
    for (const ev of events) {
      window.addEventListener(ev, resetTimer);
    }

    // Al desmontar (o al cambiar user), limpiamos todo
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      for (const ev of events) {
        window.removeEventListener(ev, resetTimer);
      }
    };
  }, [user, timeoutMs, signOut]);

  return null; 
}
