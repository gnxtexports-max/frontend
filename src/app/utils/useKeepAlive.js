import { useEffect, useRef } from "react";

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function useKeepAlive() {
  const pongRef = useRef(null);

  useEffect(() => {
    const INTERVAL_MS = 420000; // 7 min — survives browser background throttling

    const pingBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const now = new Date().toLocaleTimeString();
          console.log(`[Keep-Alive] OK at ${now} · ${data.socketClients} socket(s)`);
          if (pongRef.current) clearTimeout(pongRef.current);
        }
      } catch {
        /* silent — BackendHealthContext handles UI alerts */
      }
    };

    pingBackend();
    const timer = setInterval(pingBackend, INTERVAL_MS);

    // Re-ping immediately when tab becomes visible again (wake from sleep)
    const onVisible = () => { if (!document.hidden) pingBackend(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (pongRef.current) clearTimeout(pongRef.current);
    };
  }, []);
}
