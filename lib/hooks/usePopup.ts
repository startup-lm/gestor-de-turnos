"use client";

import { useState, useCallback } from "react";
import { toast } from "@/lib/store/useToastStore";

export function usePopup(initialMessage = "", initialSuccess = false) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [success, setSuccess] = useState(initialSuccess);

  const open = (msg: string, isSuccess: boolean) => {
    setMessage(msg);
    setSuccess(isSuccess);
    setShow(true);

    // Disparar toast no bloqueante
    if (isSuccess) {
      toast.success(msg);
    } else {
      toast.error(msg);
    }
  };
  const close = useCallback(() => setShow(false), []);

  return { show, message, success, open, close };
}