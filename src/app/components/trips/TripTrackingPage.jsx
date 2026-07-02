import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { format } from "date-fns";
import { TooltipProvider } from "../ui/tooltip";
import { TripHeader } from "./TripHeader";
import { TripKpiCards } from "./TripKpiCards";
import { TripFiltersBar } from "./TripFiltersBar";
import { TripTable } from "./TripTable";
import { statusStyles } from "./data/tripData";

const API_BASE_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";

export function TripTrackingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("all");
  const [showNotDispatched, setShowNotDispatched] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [gpsLocations, setGpsLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Arrival time picker state
  const [arrivalPickerOpen, setArrivalPickerOpen] = useState(false);
  const [arrivalShipmentId, setArrivalShipmentId] = useState(null);
  const [arrivalDateTime, setArrivalDateTime] = useState("");

  useEffect(() => {
    fetchTripData();
  }, []);

  // Silent refresh on cache updates
  useEffect(() => {
    const handler = () => fetchTripData();
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, []);

  const fetchTripData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, shipmentsRes, gpsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/vehicles`),
        axios.get(`${API_BASE_URL}/shipments?limit=100`),
        axios.get(`${API_BASE_URL}/gps/all`)
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (shipmentsRes.data.success) setShipments(shipmentsRes.data.data);
      if (gpsRes.data.success) setGpsLocations(gpsRes.data.data);
    } catch (error) {
      console.error("Error fetching trip tracking data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper: get local datetime-local string
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

  const getCombinedVehicles = () => {
    return vehicles.map(vehicle => {
      // Show all non-cancelled shipments (including Closed — arrival already submitted)
      const activeShipment = shipments.find(
        s => s.vehicleNumber === vehicle.vehicleNo && s.status !== "Cancelled"
      );

      // Find GPS location for this vehicle
      const gps = gpsLocations.find(g => g.vehicleNo === vehicle.vehicleNo);

      const isDispatched = activeShipment?.status === "In Transit";
      const isReturning = activeShipment?.status === "Delivered";

      let finalStatus = "Idle";
      if (activeShipment) {
        if (activeShipment.status === "Pending") {
          finalStatus = "Waiting for Dispatch";
        } else if (activeShipment.status === "In Transit") {
          finalStatus = "In Transit";
        } else         if (activeShipment.status === "Delivered") {
          finalStatus = "Returning";
        } else if (activeShipment.status === "Closed" && activeShipment.returnedDate) {
          finalStatus = "Arrived";
        } else if (activeShipment.status === "Closed") {
          finalStatus = "Awaiting Arrival";
        } else {
          finalStatus = activeShipment.status;
        }
      } else if (vehicle.status === "Assigned" || vehicle.status === "In Transit") {
        finalStatus = "Idle";
      } else {
        finalStatus = vehicle.status || "Idle";
      }

      const vehicleType = vehicle.ownership === "Company" ? "Own" : "Rented";

      return {
        vehicleNumber: vehicle.vehicleNo,
        driverName: activeShipment?.driverName || "Idle Driver",
        driverPhone: activeShipment?.driverPhone || "---",
        shipmentId: activeShipment?.shipmentId || "---",
        shipmentDbId: activeShipment?._id || null,
        shipmentStatus: activeShipment?.status || null,
        hasReturnedDate: !!activeShipment?.returnedDate,
        dealerName: activeShipment?.destinations?.[0]?.customerName || "---",
        dealerLocation: activeShipment?.destinations?.[0]?.deliveryLocation || "---",
        origin: "Mumbai Warehouse, Bhiwandi",
        status: finalStatus,
        isReturning,
        currentLocation: gps?.lat != null ? `${gps.lat.toFixed(4)}° N, ${gps.lng.toFixed(4)}° E` : "Mumbai Warehouse, Bhiwandi",
        currentSpeed: gps?.speed != null ? `${gps.speed.toFixed(1)} km/h` : "0 km/h",
        avgSpeed: gps?.speed != null ? `${Math.max(10, gps.speed * 0.9).toFixed(1)} km/h` : "0 km/h",
        totalDistance: activeShipment ? 200 : 0,
        distanceCovered: activeShipment ? (gps?.speed > 0 ? 120 : 0) : 0,
        remainingDistance: activeShipment ? (gps?.speed > 0 ? 80 : 200) : 0,
        percentComplete: activeShipment ? (gps?.speed > 0 ? 60 : 0) : 0,
        eta: activeShipment ? "2h 30m" : "---",
        departedTime: activeShipment?.dispatchDate ? format(new Date(activeShipment.dispatchDate), "hh:mm a") : "---",
        lastUpdated: gps?.fixTime ? format(new Date(gps.fixTime), "hh:mm a") : "---",
        vehicleType,
        delay: null,
        dispatched: isDispatched
      };
    });
  };

  const combinedVehicles = getCombinedVehicles();

  // Manual arrival handler — opens time picker
  const handleMarkArrival = async (shipmentDbId) => {
    if (!shipmentDbId) return;
    setArrivalShipmentId(shipmentDbId);
    setArrivalDateTime("");
    setArrivalPickerOpen(true);
  };

  // Confirm and submit arrival with manual time
  const confirmArrival = async () => {
    if (!arrivalShipmentId || !arrivalDateTime) return;
    setArrivalPickerOpen(false);
    try {
      const isoDateTime = parseLocalDatetime(arrivalDateTime).toISOString();
      const res = await axios.patch(`${API_BASE_URL}/shipments/${arrivalShipmentId}/arrival`, {
        arrivalTime: isoDateTime,
      });
      if (res.data?.success) {
        fetchTripData();
      }
    } catch (err) {
      console.error("Mark arrival failed:", err);
      alert("Failed to record arrival. Please try again.");
    }
  };

  const filteredVehicles = combinedVehicles.filter((v) => {
    const matchesSearch =
      searchQuery === "" ||
      v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.shipmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.dealerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.currentLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ? true :
        statusFilter === "active" ? v.status !== "Idle" :
          v.status === statusFilter;

    const matchesType =
      vehicleTypeFilter === "all" || v.vehicleType === vehicleTypeFilter;

    const matchesDispatch = showNotDispatched ? !v.dispatched : true;

    return matchesSearch && matchesStatus && matchesType && matchesDispatch;
  });

  const statusCounts = {
    all: combinedVehicles.length,
    "In Transit": combinedVehicles.filter((v) => v.status === "In Transit").length,
    "Waiting for Dispatch": combinedVehicles.filter((v) => v.status === "Waiting for Dispatch").length,
    "Returning": combinedVehicles.filter((v) => v.status === "Returning").length,
    "Awaiting Arrival": combinedVehicles.filter((v) => v.status === "Awaiting Arrival").length,
    "Arrived": combinedVehicles.filter((v) => v.status === "Arrived").length,
    Idle: combinedVehicles.filter((v) => v.status === "Idle").length,
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col p-6 gap-6">
        <TripHeader totalVehicles={combinedVehicles.length} />
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground">Loading trip tracking details...</p>
          </div>
        ) : (
          <>
            <TripKpiCards statusCounts={statusCounts} />
            <TripFiltersBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              vehicleTypeFilter={vehicleTypeFilter}
              setVehicleTypeFilter={setVehicleTypeFilter}
              showNotDispatched={showNotDispatched}
              setShowNotDispatched={setShowNotDispatched}
              filteredVehicles={filteredVehicles}
              statusCounts={statusCounts}
              vehicles={combinedVehicles}
            />
            <TripTable
              filteredVehicles={filteredVehicles}
              onNavigate={(vehicleNumber) => navigate(`/tracking/${vehicleNumber}`)}
              onMarkArrival={handleMarkArrival}
            />
          </>
        )}

        {/* ── Arrival Time Picker Modal ───────────────────── */}
        {arrivalPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-foreground">Set Arrival Time</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Select the exact date and time the vehicle arrived back at the warehouse.
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">Arrived At</label>
                <input
                  type="datetime-local"
                  value={arrivalDateTime}
                  onChange={(e) => setArrivalDateTime(e.target.value)}
                  className="w-full h-10 rounded-lg border border-border bg-slate-50 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8] transition"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setArrivalPickerOpen(false)}
                  className="flex-1 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!arrivalDateTime}
                  onClick={confirmArrival}
                  className="flex-1 h-9 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Arrival
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
export default TripTrackingPage;
