import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router";
import { statusStyles } from "./data/vehicleTrackingData";
import { VehicleTrackingHeader } from "./VehicleTrackingHeader";
import { KpiCards }              from "./KpiCards";
import { TimelineSection }       from "./TimelineSection";
import { QuickActionsPanel }     from "./QuickActionsPanel";

const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
const POLL_INTERVAL_MS = 420_000; // poll every 7 min; real-time via socket events

export function VehicleTrackingPage() {
  const location = useLocation();
  const vehicleId = location.pathname.split("/").filter(Boolean).pop();
  const [dispatched, setDispatched]   = useState(false);
  const [activeShipment, setActiveShipment] = useState(null);
  const [isPolling, setIsPolling]     = useState(false);
  const [lastPoll, setLastPoll]       = useState(null);
  const pollRef = useRef(null);

  // ── Time picker modal state ──────────────────────────
  const [timePickerOpen, setTimePickerOpen]   = useState(false);
  const [timePickerMode, setTimePickerMode]   = useState(null); // "dispatch" | "arrival"
  const [selectedDateTime, setSelectedDateTime] = useState("");

  // Fetch active shipment for this vehicle from MongoDB
  const fetchActiveShipment = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/shipments?limit=100`, { credentials: "include" });
      const json = await res.json();
      if (json.success && json.data) {
        // Find active shipment: not cancelled, and (not closed OR closed without returnedDate)
        const active = json.data.find(
          (s) => s.vehicleNumber === vehicleId && s.status !== "Cancelled" && !(s.status === "Closed" && s.returnedDate)
        );
        if (active) {
          setActiveShipment(active);
          setDispatched(active.status !== "Pending");
        } else {
          // If no active trip, check if there is a recently closed trip for display
          const recentlyClosed = json.data.find(
            (s) => s.vehicleNumber === vehicleId && s.status === "Closed"
          );
          setActiveShipment(recentlyClosed || null);
          setDispatched(recentlyClosed ? true : false);
        }
      }
    } catch (err) {
      console.error("Error fetching active shipment:", err);
    }
  }, [vehicleId]);

  // Helper: get local datetime-local string for default value (now)
  const nowLocalISO = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = now.getFullYear();
    const mm = pad(now.getMonth() + 1);
    const dd = pad(now.getDate());
    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Helper to parse "YYYY-MM-DDTHH:mm" strictly as local browser time
  const parseLocalDatetime = (str) => {
    if (!str) return new Date();
    try {
      const [datePart, timePart] = str.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hours, minutes);
    } catch (e) {
      return new Date(str);
    }
  };

  // Open the time picker dialog
  const openTimePicker = (mode) => {
    setTimePickerMode(mode);
    setSelectedDateTime(mode === "dispatch" ? nowLocalISO() : "");
    setTimePickerOpen(true);
  };

  // Confirm and submit dispatch
  const confirmDispatch = async () => {
    if (!activeShipment || !selectedDateTime) return;
    setTimePickerOpen(false);
    try {
      const isoDateTime = parseLocalDatetime(selectedDateTime).toISOString();
      const res = await fetch(`${API_BASE}/shipments/${activeShipment._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "In Transit", dispatchDate: isoDateTime }),
      });
      const json = await res.json();
      if (json.success) {
        setDispatched(true);
        setActiveShipment(json.data);
      } else {
        alert(json.message || "Dispatch failed");
      }
    } catch (err) {
      console.error("Dispatch failed:", err);
      alert("Error triggering dispatch");
    }
  };

  // Confirm and submit arrival/return
  const confirmArrival = async () => {
    if (!activeShipment || !selectedDateTime) return;
    setTimePickerOpen(false);
    try {
      const isoDateTime = parseLocalDatetime(selectedDateTime).toISOString();
      const res = await fetch(`${API_BASE}/shipments/${activeShipment._id}/arrival`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ arrivalTime: isoDateTime }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveShipment(json.data);
        alert("Vehicle arrival recorded successfully!");
      } else {
        alert(json.message || "Recording arrival failed");
      }
    } catch (err) {
      console.error("Recording arrival failed:", err);
      alert("Error recording vehicle arrival");
    }
  };

  // Close shipment without setting arrival time
  const closeShipment = async () => {
    if (!activeShipment) return;
    try {
      const res = await fetch(`${API_BASE}/shipments/${activeShipment._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "Closed" }),
      });
      const json = await res.json();
      if (json.success) {
        setActiveShipment(json.data);
        alert("Shipment closed. Now mark arrival when vehicle returns.");
      } else {
        alert(json.message || "Closing shipment failed");
      }
    } catch (err) {
      console.error("Closing shipment failed:", err);
      alert("Error closing shipment");
    }
  };

  // Build movement timeline dynamically based on exact database states requested:
  // 1. shipment planned
  // 2. dispatched from warehouse
  // 3. in transit (after dispatched) both same time
  // 4. cargo delivered
  // 5. returned
  const timeline = [];
  if (activeShipment) {
    // 1. Shipment Planned
    timeline.push({
      step: "Shipment Planned",
      timestamp: activeShipment.createdAt
        ? new Date(activeShipment.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "---",
      completed: true,
      active: activeShipment.status === "Pending",
    });

    // 2. Dispatched from Warehouse
    const isDispatched = activeShipment.status !== "Pending";
    timeline.push({
      step: "Dispatched from Warehouse",
      timestamp: activeShipment.dispatchDate
        ? new Date(activeShipment.dispatchDate).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "---",
      completed: isDispatched,
      active: false,
    });

    // 3. In Transit (Active at same time when dispatched)
    const isInTransit = activeShipment.status === "In Transit";
    const completedTransit = activeShipment.status === "Delivered" || activeShipment.status === "Closed";
    timeline.push({
      step: "In Transit",
      timestamp: activeShipment.dispatchDate
        ? new Date(activeShipment.dispatchDate).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "---",
      completed: completedTransit || isInTransit,
      active: isInTransit,
      detail: isInTransit ? "Vehicle is actively in transit towards the destination." : null
    });

    // 4. Cargo Delivered
    const isDelivered = activeShipment.status === "Delivered" || activeShipment.status === "Closed";
    timeline.push({
      step: "Cargo Delivered",
      timestamp: activeShipment.deliveryDate
        ? new Date(activeShipment.deliveryDate).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "---",
      completed: isDelivered,
      active: activeShipment.status === "Delivered",
    });

    // 5. Shipment Closed (administrative closure, no time required)
    const isClosed = activeShipment.status === "Closed";
    timeline.push({
      step: "Shipment Closed",
      timestamp: isClosed ? "Closed" : "---",
      completed: isClosed,
      active: isClosed && !activeShipment.returnedDate,
      detail: isClosed && !activeShipment.returnedDate ? "Shipment closed. Waiting for arrival time entry." : null
    });

    // 6. Arrival Recorded (manual time entry by user)
    const hasArrived = isClosed && !!activeShipment.returnedDate;
    timeline.push({
      step: "Arrival Recorded",
      timestamp: activeShipment.returnedDate
        ? new Date(activeShipment.returnedDate).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
        : "---",
      completed: hasArrived,
      active: false,
      detail: hasArrived ? "Vehicle arrived back at factory/warehouse. Available." : null
    });
  }

  // Resolve dynamic, live details for right side quick actions panel
  const data = {
    vehicleNumber: vehicleId,
    driverName: activeShipment?.driverName || "Unknown",
    driverPhone: activeShipment?.driverPhone || "---",
    status: activeShipment 
      ? (activeShipment.status === "Pending" ? "Waiting for Dispatch" 
        : activeShipment.status === "In Transit" ? "In Transit" 
        : activeShipment.status === "Delivered" ? "Delivered"
        : activeShipment.status === "Closed" && !activeShipment.returnedDate ? "Awaiting Arrival"
        : activeShipment.status === "Closed" ? "Arrived"
        : activeShipment.status) 
      : "Idle",
    shipmentId: activeShipment?.shipmentId || "---",
    dealerName: activeShipment?.destinations?.[0]?.customerName || "---",
    dealerLocation: activeShipment?.destinations?.[0]?.deliveryLocation || "---",
    timeline,
  };

  const ss = statusStyles[data.status] ?? statusStyles.Idle;

  const triggerRefresh = useCallback(async () => {
    setIsPolling(true);
    await fetchActiveShipment();
    setIsPolling(false);
    setLastPoll(new Date());
  }, [fetchActiveShipment]);

  // Silent refresh on cache updates
  useEffect(() => {
    const handler = () => triggerRefresh();
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, [triggerRefresh]);

  // Start polling
  useEffect(() => {
    triggerRefresh();
    pollRef.current = setInterval(triggerRefresh, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [triggerRefresh]);

  return (
    <div className="h-full flex flex-col bg-background">
      <VehicleTrackingHeader
        data={data}
        ss={ss}
        onDispatch={() => openTimePicker("dispatch")}
        onReturn={() => openTimePicker("arrival")}
        onCloseShipment={closeShipment}
        isPolling={isPolling}
        lastPoll={lastPoll}
        onRefresh={triggerRefresh}
        activeShipment={activeShipment}
      />

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left content — 3 cols */}
          <div className="xl:col-span-3 space-y-6">
            <KpiCards
              departedTime={activeShipment?.dispatchDate ? new Date(activeShipment.dispatchDate).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "---"}
              arrivedTime={activeShipment?.returnedDate
                ? new Date(activeShipment.returnedDate).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                : "---"}

            />
            {activeShipment && <TimelineSection data={data} />}
          </div>

          {/* Right sidebar — 1 col */}
          <div className="xl:col-span-1">
            <QuickActionsPanel data={data} />
          </div>
        </div>
      </div>

      {/* ── Manual Time Picker Modal ───────────────────── */}
      {timePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6 space-y-5">
            {/* Header */}
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {timePickerMode === "dispatch" ? "Set Dispatch Time" : "Set Arrival Time"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {timePickerMode === "dispatch"
                  ? "Select the exact date and time the vehicle departed the warehouse."
                  : "Select the exact date and time the vehicle arrived back."}
              </p>
            </div>

            {/* Datetime Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                {timePickerMode === "dispatch" ? "Departed At" : "Arrived At"}
              </label>
              <input
                type="datetime-local"
                value={selectedDateTime}
                onChange={(e) => setSelectedDateTime(e.target.value)}
                className="w-full h-10 rounded-lg border border-border bg-slate-50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] transition"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setTimePickerOpen(false)}
                className="flex-1 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedDateTime}
                onClick={timePickerMode === "dispatch" ? confirmDispatch : confirmArrival}
                className="flex-1 h-9 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timePickerMode === "dispatch" ? "Confirm Dispatch" : "Confirm Arrival"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleTrackingPage;
