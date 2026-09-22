import { useState, useCallback, useEffect } from "react";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api") + "/supervisors";

export function useSupervisors() {
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSupervisors = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (params.search) queryParams.append("search", params.search);
      if (params.status && params.status !== "all") queryParams.append("status", params.status);

      const url = `${API_BASE_URL}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch supervisors");
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setSupervisors(list);
    } catch (err) {
      console.error("Error loading supervisors:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    supervisors,
    loading,
    error,
    fetchSupervisors,
    setSupervisors,
  };
}

export default useSupervisors;
