import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router";
import { TooltipProvider } from "../ui/tooltip";
import ShipmentHeader from "./ShipmentHeader";
import ShipmentFiltersBar from "./ShipmentFiltersBar";
import ShipmentTable from "./ShipmentTable";
import { CreateShipmentSheet } from "./CreateShipmentSheet";
import { ViewShipmentSheet } from "./ViewShipmentSheet";
import { useShipments } from "./hooks/useShipments";
import { getPODConfig, isWithinDateRange } from "./utils/shipmentStyles";
import { HistoryShipmentSheet } from "./HistoryShipmentSheet";

export function ShipmentList() {
  const { shipmentData, setShipmentData, loading, fetchShipments } = useShipments();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [viewSheetOpen, setViewSheetOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (location.state?.openCreate) {
      setSheetOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [editShipment, setEditShipment] = useState(null); // shipment to edit
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [podFilter, setPodFilter] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Live refresh on socket cache update
  useEffect(() => {
    const handler = () => fetchShipments();
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, [fetchShipments]);

  useEffect(() => {
    setTotal(shipmentData.length);
  }, [shipmentData]);

  const activeShipmentsOnly = useMemo(() => {
    const list = Array.isArray(shipmentData) ? shipmentData : [];
    return list.filter(s => {
      if (s.status === "Cancelled" || s.status === "Closed") return false;
      return true;
    });
  }, [shipmentData]);

  const historyShipmentsOnly = useMemo(() => {
    const list = Array.isArray(shipmentData) ? shipmentData : [];
    return list.filter(s => {
      if (s.status === "Cancelled" || s.status === "Closed") return true;
      return false;
    });
  }, [shipmentData]);

  const filteredShipments = useMemo(() => {
    const list = activeShipmentsOnly;
    return list.filter((s) => {
      const matchesSearch =
        searchQuery === "" ||
        (s.shipmentId && s.shipmentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.driverName && s.driverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.vehicleNumber && s.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.destinations?.[0]?.plantReferenceNumber && s.destinations[0].plantReferenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.destinations?.[0]?.lrNumber && s.destinations[0].lrNumber.toLowerCase().includes(searchQuery.toLowerCase()));

      const mappedStatus = s.status;
      const matchesStatus = statusFilter === "all" || mappedStatus === statusFilter;
      const matchesDate = dateFilter === "all" || isWithinDateRange(s.createdAt, dateFilter);

      const podConfig = getPODConfig(s);
      const matchesPod =
        podFilter === "all" ||
        (podFilter === "Pending" && podConfig.label === "Pending") ||
        (podFilter === "Partial" && podConfig.label.startsWith("Partial")) ||
        (podFilter === "Signed" && podConfig.label === "Signed") ||
        (podFilter === "Not Generated" && podConfig.label === "Not Generated");

      return matchesSearch && matchesStatus && matchesDate && matchesPod;
    });
  }, [activeShipmentsOnly, searchQuery, statusFilter, dateFilter, podFilter]);

  const statusCounts = useMemo(() => {
    const list = activeShipmentsOnly;
    const counts = {
      all: activeShipmentsOnly.length,
      Pending: 0,
      "In Transit": 0,
      Delivered: 0,
      Cancelled: 0,
      filtered: filteredShipments.length,
    };
    list.forEach((s) => {
      if (counts[s.status] !== undefined) counts[s.status]++;
    });
    return counts;
  }, [activeShipmentsOnly, filteredShipments.length]);

  const getRobustApiUrl = () => {
    let raw = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
    raw = raw.replace(/\/$/, "");
    if (!raw.endsWith("/api")) {
      raw += "/api";
    }
    return raw;
  };
  const API_BASE_URL = getRobustApiUrl();

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`${API_BASE_URL}/shipments/export?${params.toString()}`, { credentials: "include" });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Export failed"); }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `GNXT_Shipments_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed: " + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid Excel or CSV file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/invoices/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      // after upload, refetch shipments/invoices as your API requires
      await fetchShipments();
      setTimeout(() => setUploading(false), 500);
    } catch (err) {
      console.error(err);
      setUploading(false);
      alert(err.message || "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const handleDeleted = (invoiceId) => {
    // update local state
    setShipmentData((prev) =>
      prev
        .map((s) => ({
          ...s,
          invoices: Array.isArray(s.invoices) ? s.invoices.filter((inv) => inv._id !== invoiceId) : s.invoices,
        }))
        .filter((p) => (p.invoices ? p.invoices.length > 0 : true))
    );
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col p-6 gap-6">
        <ShipmentHeader
          total={activeShipmentsOnly.length}
          onCreateClick={() => setSheetOpen(true)}
          onHistoryClick={() => setHistoryOpen(true)}
          onExport={handleExport}
        />

        <ShipmentFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          podFilter={podFilter}
          onPodFilterChange={setPodFilter}
          statusCounts={{ ...statusCounts }}
          totalShipments={activeShipmentsOnly.length}
        />

        <div className="bg-white rounded-lg border border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex flex-col">
          <ShipmentTable
            filteredShipments={filteredShipments}
            loading={loading}
            setSelectedShipment={setSelectedShipment}
            setViewSheetOpen={setViewSheetOpen}
            setEditShipment={(s) => { setEditShipment(s); setSheetOpen(true); }}
            shipmentData={shipmentData}
            setShipmentData={setShipmentData}
            onDeleted={handleDeleted}
          />
        </div>

        <CreateShipmentSheet
          open={sheetOpen}
          onOpenChange={(v) => { setSheetOpen(v); if (!v) setEditShipment(null); }}
          editShipment={editShipment}
          onCreated={() => fetchShipments()}
        />
        <ViewShipmentSheet
          open={viewSheetOpen}
          onOpenChange={setViewSheetOpen}
          shipment={selectedShipment}
          onStatusChange={(updated) => {
            // Reflect status change in the list without a full refetch
            setShipmentData((prev) =>
              prev.map((s) => (s._id === updated._id ? { ...s, ...updated } : s))
            );
          }}
          onEdit={(s) => { setEditShipment(s); setSheetOpen(true); }}
        />
        <HistoryShipmentSheet
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          historyShipments={historyShipmentsOnly}
          setSelectedShipment={setSelectedShipment}
          setViewSheetOpen={setViewSheetOpen}
          onDeleted={() => fetchShipments()}
        />
      </div>
    </TooltipProvider>
  );
}

export default ShipmentList;