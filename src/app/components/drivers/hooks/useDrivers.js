import { useState, useCallback } from "react";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api") + "/drivers";

export function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_BASE_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch drivers");
      const data = await res.json();
      setDrivers(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching drivers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    drivers,
    loading,
    error,
    fetchDrivers,
  };
}