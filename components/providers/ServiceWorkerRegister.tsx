"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || window.serwist === undefined) {
      return;
    }

    try {
      Promise.resolve(window.serwist.register()).catch(() => {});
    } catch {
      // SW is optional: silently swallow errors
    }
  }, []);

  return null;
}
