"use client";

import { useState, useCallback } from "react";

export function usePopup(initialMessage = "", initialSuccess = false) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [success, setSuccess] = useState(initialSuccess);

  const open = (msg: string, isSuccess: boolean) => {
    setMessage(msg);
    setSuccess(isSuccess);
    setShow(true);
  };
  const close = useCallback(() => setShow(false), []);

  return { show, message, success, open, close };
}