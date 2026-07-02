import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import VehicleHeader from "./VehicleHeader";
import VehicleFiltersBar from "./VehicleFiltersBar";
import VehicleTable from "./VehicleTable";
import AddVehicleSheet from "./AddVehicleSheet";

const API_BASE_URL = (import.meta.env?.VITE_API_URL || "http://localhost:5000/api") + "/vehicles";

export function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicles, setVehicles] = useState([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState("all");
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    vehicleNo: "",
    type: "",
    model: "",
    capacityKg: "",
    insuranceExpiry: "",
    ownership: "",
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Live refresh on socket cache update
  useEffect(() => {
    const handler = () => fetchVehicles();
    window.addEventListener("api-cache-updated", handler);
    return () => window.removeEventListener("api-cache-updated", handler);
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE_URL, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchesSearch =
      (v.vehicleNo || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.model || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v._id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.type || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesAvail = availFilter === "all" || v.availability === availFilter;

    return matchesSearch && matchesStatus && matchesAvail;
  });

  const totalActive = vehicles.filter(
    (v) => v.status === "Active" || v.status === "In Transit"
  ).length;

  const totalIdle = vehicles.filter((v) => v.status === "Idle").length;

  const totalMaintenance = vehicles.filter(
    (v) => v.status === "Maintenance" || v.status === "Breakdown"
  ).length;

  // ==================== ADD VEHICLE ====================
  const handleAddVehicle = async () => {
    try {
      const url = editingVehicle
        ? `${API_BASE_URL}/${editingVehicle._id}`
        : API_BASE_URL;

      const method = editingVehicle ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          vehicleNo: newVehicle.vehicleNo,
          type: newVehicle.type,
          model: newVehicle.model,
          capacityKg: Number(newVehicle.capacityKg),
          insuranceExpiry: newVehicle.insuranceExpiry,
          ownership: newVehicle.ownership,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error:", error);
        alert(error.message || "Error saving vehicle");
        return;
      }

      const savedVehicle = await res.json();

      if (editingVehicle) {
        // Update existing vehicle in list
        setVehicles((prev) =>
          prev.map((v) => (v._id === savedVehicle._id ? savedVehicle : v))
        );
      } else {
        // Add new vehicle to list
        setVehicles((prev) => [savedVehicle, ...prev]);
      }

      setAddSheetOpen(false);
      setEditingVehicle(null);
      setNewVehicle({
        vehicleNo: "",
        type: "",
        model: "",
        capacityKg: "",
        insuranceExpiry: "",
        ownership: "",
      });
    } catch (error) {
      console.error("Error saving vehicle:", error);
      alert("Failed to save vehicle");
    }
  };

  // ==================== EDIT VEHICLE ====================
  const handleEditVehicle = (vehicle) => {
    setEditingVehicle(vehicle);
    setNewVehicle({
      vehicleNo: vehicle.vehicleNo || "",
      type: vehicle.type || "",
      model: vehicle.model || "",
      capacityKg: vehicle.capacityKg != null ? vehicle.capacityKg.toString() : "",
      insuranceExpiry: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.split("T")[0] : "",
      ownership: vehicle.ownership || "",
    });
    setAddSheetOpen(true);
  };

  // ==================== DELETE VEHICLE ====================
  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/${vehicleId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete vehicle");
      }

      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
      alert("Vehicle deleted successfully");
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      alert("Failed to delete vehicle");
    }
  };

  // ==================== SCHEDULE MAINTENANCE ====================
  const handleScheduleMaintenance = async (vehicle) => {
    try {
      const newStatus =
        vehicle.status === "Maintenance" ? "Idle" : "Maintenance";

      const res = await fetch(`${API_BASE_URL}/${vehicle._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      const updatedVehicle = await res.json();
      setVehicles((prev) =>
        prev.map((v) => (v._id === updatedVehicle._id ? updatedVehicle : v))
      );
    } catch (error) {
      console.error("Error updating maintenance status:", error);
      alert("Failed to update maintenance status");
    }
  };

  // ==================== TRACK LOCATION ====================
  const handleTrackLocation = (vehicle) => {
    alert(`Tracking location for ${vehicle.vehicleNo} - Feature coming soon!`);
    // TODO: Implement location tracking/map view
  };

  // ==================== CLEAR FILTERS ====================
  const handleClearFilters = () => {
    setStatusFilter("all");
    setAvailFilter("all");
    setSearchQuery("");
  };

  // ==================== HANDLE VEHICLE CHANGE ====================
  const handleVehicleChange = (updateFn) => {
    setNewVehicle((prev) => updateFn(prev));
  };

  // ==================== CLOSE SHEET ====================
  const handleCloseSheet = () => {
    setAddSheetOpen(false);
    setEditingVehicle(null);
    setNewVehicle({
      vehicleNo: "",
      type: "",
      model: "",
      capacityKg: "",
      insuranceExpiry: "",
      ownership: "",
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* ── HEADER ─── */}
      <VehicleHeader
        totalActive={totalActive}
        totalIdle={totalIdle}
        totalMaintenance={totalMaintenance}
        totalVehicles={vehicles.length}
        onAddVehicleClick={() => {
          setEditingVehicle(null);
          setNewVehicle({
            vehicleNo: "",
            type: "",
            model: "",
            capacityKg: "",
            insuranceExpiry: "",
            ownership: "",
          });
          setAddSheetOpen(true);
        }}
      />

      {/* ── FILTERS BAR ─── */}
      <VehicleFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        availFilter={availFilter}
        onAvailFilterChange={setAvailFilter}
        onClearFilters={handleClearFilters}
        hasActiveFilters={
          statusFilter !== "all" ||
          availFilter !== "all" ||
          searchQuery
        }
      />

      {/* ── TABLE ─── */}
      <VehicleTable
        vehicles={filtered}
        totalVehicles={vehicles.length}
        loading={loading}
        onEditVehicle={handleEditVehicle}
        onDeleteVehicle={handleDeleteVehicle}
        onScheduleMaintenance={handleScheduleMaintenance}
        onTrackLocation={handleTrackLocation}
      />

      {/* ── ADD/EDIT VEHICLE SHEET ─── */}
      <AddVehicleSheet
        open={addSheetOpen}
        onOpenChange={handleCloseSheet}
        newVehicle={newVehicle}
        onVehicleChange={handleVehicleChange}
        onAddVehicle={handleAddVehicle}
        isEditing={!!editingVehicle}
      />
    </div>
  );
}
