import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

const BackendHealthContext = createContext(null);

export function BackendHealthProvider({ children }) {
  const [isBackendOnline, setIsBackendOnline] = useState(true);
  const [lastHealthCheck, setLastHealthCheck] = useState(null);
  const [socketClients, setSocketClients] = useState(0);
  const [checkInterval, setCheckInterval] = useState(420000);
  const wasOffline = useRef(false);
  const intervalRef = useRef(null);

  const checkHealth = useCallback(async () => {
    try {
      const start = performance.now();
      const response = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(8000) });
      const latency = Math.round(performance.now() - start);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const now = new Date();

      setLastHealthCheck(now);
      setSocketClients(data.socketClients ?? 0);

      if (!isBackendOnline) {
        console.log(`[BackendHealth] Backend recovered at ${now.toLocaleTimeString()} (${latency}ms)`);
        toast.success("Backend Connected", {
          description: `Response time: ${latency}ms · ${data.socketClients} socket client(s)`,
          duration: 4000,
        });
      }

      setIsBackendOnline(true);
      wasOffline.current = false;
    } catch (err) {
      if (err.name === "AbortError") return;

      const now = new Date();
      setLastHealthCheck(now);
      setSocketClients(0);

      if (!wasOffline.current) {
        console.error(`[BackendHealth] Backend DOWN at ${now.toLocaleTimeString()} — ${err.message}`);
        toast.error("Backend Unreachable", {
          description: `API at ${API_URL}/health did not respond. Some features may not work.`,
          duration: 8000,
        });
      }

      setIsBackendOnline(false);
      wasOffline.current = true;
    }
  }, [isBackendOnline]);

  useEffect(() => {
    checkHealth();
    intervalRef.current = setInterval(checkHealth, checkInterval);
    return () => clearInterval(intervalRef.current);
  }, [checkInterval]);

  return (
    <BackendHealthContext.Provider value={{ isBackendOnline, lastHealthCheck, socketClients, checkInterval, setCheckInterval }}>
      {children}
    </BackendHealthContext.Provider>
  );
}

export function useBackendHealth() {
  const ctx = useContext(BackendHealthContext);
  if (!ctx) throw new Error("useBackendHealth must be used within BackendHealthProvider");
  return ctx;
}
