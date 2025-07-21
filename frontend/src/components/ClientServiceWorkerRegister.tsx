"use client";
import { useEffect } from "react";

export default function ClientServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker.register("/service-worker.js");
    }
  }, []);
  return null;
} 