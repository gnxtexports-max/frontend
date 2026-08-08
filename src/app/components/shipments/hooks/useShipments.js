import { useState, useCallback } from "react";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function useShipments() {
  const [shipmentData, setShipmentData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchShipments = useCallback(async (fromDate, toDate) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);
      const queryString = params.toString() ? `?${params.toString()}` : "";

      const res = await fetch(`${API_BASE_URL}/shipments${queryString}`);
      const json = await res.json();
      // Handle both plain array and { data: [] } shaped responses
      const list = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
      setShipmentData(list);
    } catch (err) {
      console.error("Failed to fetch shipments", err);
      setShipmentData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    shipmentData,
    setShipmentData,
    loading,
    fetchShipments,
    API_BASE_URL,
  };
}